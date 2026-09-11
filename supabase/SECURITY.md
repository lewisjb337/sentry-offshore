# Sentry Offshore security notes

Apply `security_hardening_migration.sql` after the original schema and the movement/operations RPC patches.

## Security model

- The browser uses only the Supabase **anon** key. Never place a `service_role` key in React or any `REACT_APP_*` variable.
- Authentication is handled by Supabase Auth.
- Every tenant-owned row carries `organization_id` and Row Level Security checks membership/role at the database boundary.
- Composite foreign keys stop a row in one organization referencing a person, vessel, project or operation in another organization.
- Operational movement/operation tables are read-only over direct PostgREST DML. Mutations go through the validated RPC functions.
- Completed movements and completed/attention operations are immutable. Managers+ can void them with a reason rather than rewriting history.
- Generated reports are append-only immutable snapshots.
- Audit rows are trigger-written and visible only to owner/admin/manager because snapshots can contain private personnel data.
- Organization `plan` and `subscription_status` cannot be changed from the browser. Only `name` and `slug` are client-editable for owner/admin.
- Public profile email cannot be spoofed through `public.profiles`; the editable profile fields are `full_name` and `avatar_url`.

## Before production

1. Run the migration in the Supabase SQL editor.
2. Confirm email confirmation is enabled in Supabase Auth.
3. Add the production site URL and approved redirect URLs only.
4. Use strong password requirements and consider MFA for owner/admin accounts.
5. Verify no service-role key exists in the frontend, repository history or deployment environment exposed to the browser.
6. Test with two real accounts in two different organizations. Attempt SELECT/INSERT/UPDATE/DELETE against each other's UUIDs directly from the browser console or a REST client using each user's access token. Every cross-tenant attempt must return no rows or an RLS/permission error.
7. Keep database backups/PITR appropriate for the production plan.

## Useful verification queries

```sql
-- Every Sentry application table should show rowsecurity = true.
select relname, relrowsecurity
from pg_class
where relnamespace = 'public'::regnamespace
  and relkind = 'r'
  and relname in (
    'profiles','organizations','organization_members','projects','people',
    'person_private_details','person_documents','person_certificates','person_medicals',
    'vessels','vessel_certificates','movement_events','movement_participants',
    'operations','musters','muster_participants','daily_operation_logs',
    'personnel_transfer_operations','personnel_transfer_participants','reports','audit_log'
  )
order by relname;

-- Inspect effective policies.
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- There should be no table privileges for anon on application tables.
select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon','authenticated')
order by grantee, table_name, privilege_type;
```
