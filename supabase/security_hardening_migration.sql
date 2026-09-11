-- Sentry Offshore — MVP security & audit hardening
-- Apply AFTER the initial schema and the movement/operations RPC patches.
-- Safe to re-run where practical; policy/trigger recreation is explicit.

begin;

-- =========================================================
-- 1. LIMIT CLIENT WRITE SURFACE
-- Operational ledgers are written through validated SECURITY DEFINER RPCs,
-- not arbitrary PostgREST table UPDATE/DELETE calls.
-- =========================================================

revoke insert, update, delete on
    public.movement_events,
    public.movement_participants,
    public.operations,
    public.musters,
    public.muster_participants,
    public.daily_operation_logs,
    public.personnel_transfer_operations,
    public.personnel_transfer_participants
from authenticated;

grant select on
    public.movement_events,
    public.movement_participants,
    public.operations,
    public.musters,
    public.muster_participants,
    public.daily_operation_logs,
    public.personnel_transfer_operations,
    public.personnel_transfer_participants
 to authenticated;

-- Reports are append-only from the browser. Once written/generated they are
-- historical snapshots, not editable CRUD rows.
revoke update, delete on public.reports from authenticated;
grant select, insert on public.reports to authenticated;

-- Organization billing/subscription fields must never be self-upgradable by
-- changing a public table row from the browser.
revoke insert, update, delete on public.organizations from authenticated;
grant select on public.organizations to authenticated;
grant update (name, slug) on public.organizations to authenticated;

-- Public profiles can only change presentation fields. Email remains sourced
-- from Supabase Auth and cannot be spoofed by updating public.profiles.
revoke insert, update, delete on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;

-- Audit log remains trigger-only.
revoke insert, update, delete on public.audit_log from authenticated;
grant select on public.audit_log to authenticated;

-- =========================================================
-- 2. RESTRICT AUDIT VISIBILITY
-- audit_log contains old/new JSON snapshots and can therefore contain private
-- personnel data. Operators/viewers should not gain access to that information
-- indirectly through the audit table.
-- =========================================================

drop policy if exists audit_log_select_member on public.audit_log;
create policy audit_log_select_manager
on public.audit_log for select to authenticated
using (
    public.has_org_role(
        organization_id,
        array['owner','admin','manager']::public.organization_role[]
    )
);

-- =========================================================
-- 3. PROTECT AUTH / BILLING IDENTITY FIELDS
-- =========================================================

create or replace function public.protect_profile_identity()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
    if new.id <> old.id then
        raise exception 'Profile id cannot be changed';
    end if;

    if new.email is distinct from old.email then
        raise exception 'Profile email is managed by authentication';
    end if;

    new.created_at := old.created_at;
    return new;
end;
$$;

drop trigger if exists profiles_identity_guard on public.profiles;
create trigger profiles_identity_guard
before update on public.profiles
for each row execute function public.protect_profile_identity();

create or replace function public.protect_organization_system_fields()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
    if new.id <> old.id then
        raise exception 'Organization id cannot be changed';
    end if;

    if new.plan is distinct from old.plan then
        raise exception 'Plan cannot be changed from the client';
    end if;

    if new.subscription_status is distinct from old.subscription_status then
        raise exception 'Subscription status cannot be changed from the client';
    end if;

    if new.created_by is distinct from old.created_by then
        raise exception 'Organization creator cannot be changed';
    end if;

    new.created_at := old.created_at;
    return new;
end;
$$;

drop trigger if exists organizations_system_fields_guard on public.organizations;
create trigger organizations_system_fields_guard
before update on public.organizations
for each row execute function public.protect_organization_system_fields();

-- =========================================================
-- 4. IMMUTABLE MOVEMENT LEDGER
-- Completed records can only transition to voided, and voiding requires a
-- manager+ role plus the existing void metadata. Cancelled/voided rows stay
-- immutable. This protects the ledger even if an RPC is called manually.
-- =========================================================

create or replace function public.protect_terminal_movement()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
    if tg_op = 'DELETE' then
        if old.status in ('completed','cancelled','voided') then
            raise exception 'Recorded movement history cannot be deleted';
        end if;
        return old;
    end if;

    if old.status = 'completed' then
        if new.status = 'voided'
           and new.void_reason is not null
           and char_length(trim(new.void_reason)) >= 3
           and new.voided_at is not null
           and new.voided_by = auth.uid()
           and public.has_org_role(
                old.organization_id,
                array['owner','admin','manager']::public.organization_role[]
           )
        then
            return new;
        end if;

        raise exception 'Completed movements are immutable; void with a reason instead';
    end if;

    if old.status in ('cancelled','voided') then
        raise exception 'Cancelled or voided movements are immutable';
    end if;

    return new;
end;
$$;

drop trigger if exists movement_events_terminal_guard on public.movement_events;
create trigger movement_events_terminal_guard
before update or delete on public.movement_events
for each row execute function public.protect_terminal_movement();

-- =========================================================
-- 5. IMMUTABLE COMPLETED OPERATIONS
-- Completed and attention operations represent a finished operational record.
-- They may only transition to voided with a manager+ reason. Cancelled/voided
-- records cannot subsequently be rewritten.
-- =========================================================

create or replace function public.protect_terminal_operation()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
    if tg_op = 'DELETE' then
        if old.status in ('completed','attention','cancelled','voided') then
            raise exception 'Recorded operation history cannot be deleted';
        end if;
        return old;
    end if;

    if old.status in ('completed','attention') then
        if new.status = 'voided'
           and new.void_reason is not null
           and char_length(trim(new.void_reason)) >= 3
           and new.voided_at is not null
           and new.voided_by = auth.uid()
           and public.has_org_role(
                old.organization_id,
                array['owner','admin','manager']::public.organization_role[]
           )
        then
            return new;
        end if;

        raise exception 'Completed operations are immutable; void with a reason instead';
    end if;

    if old.status in ('cancelled','voided') then
        raise exception 'Cancelled or voided operations are immutable';
    end if;

    return new;
end;
$$;

drop trigger if exists operations_terminal_guard on public.operations;
create trigger operations_terminal_guard
before update or delete on public.operations
for each row execute function public.protect_terminal_operation();

-- =========================================================
-- 6. GENERATED REPORTS ARE IMMUTABLE SNAPSHOTS
-- =========================================================

create or replace function public.protect_generated_report()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
    if old.status = 'generated' then
        raise exception 'Generated report snapshots are immutable';
    end if;

    if tg_op = 'DELETE' then
        return old;
    end if;

    return new;
end;
$$;

drop trigger if exists reports_generated_guard on public.reports;
create trigger reports_generated_guard
before update or delete on public.reports
for each row execute function public.protect_generated_report();

-- =========================================================
-- 7. ROLE / TENANT POLICY ASSERTIONS
-- Recreate operational policies so SELECT remains tenant-scoped while direct
-- writes are denied by grants. RLS is still the primary cross-tenant boundary.
-- =========================================================

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.projects enable row level security;
alter table public.people enable row level security;
alter table public.person_private_details enable row level security;
alter table public.person_documents enable row level security;
alter table public.person_certificates enable row level security;
alter table public.person_medicals enable row level security;
alter table public.vessels enable row level security;
alter table public.vessel_certificates enable row level security;
alter table public.movement_events enable row level security;
alter table public.movement_participants enable row level security;
alter table public.operations enable row level security;
alter table public.musters enable row level security;
alter table public.muster_participants enable row level security;
alter table public.daily_operation_logs enable row level security;
alter table public.personnel_transfer_operations enable row level security;
alter table public.personnel_transfer_participants enable row level security;
alter table public.reports enable row level security;
alter table public.audit_log enable row level security;

-- Prevent accidental unauthenticated access even if a future policy is added.
revoke all on
    public.profiles,
    public.organizations,
    public.organization_members,
    public.projects,
    public.people,
    public.person_private_details,
    public.person_documents,
    public.person_certificates,
    public.person_medicals,
    public.vessels,
    public.vessel_certificates,
    public.movement_events,
    public.movement_participants,
    public.operations,
    public.musters,
    public.muster_participants,
    public.daily_operation_logs,
    public.personnel_transfer_operations,
    public.personnel_transfer_participants,
    public.reports,
    public.audit_log
from anon;

commit;
