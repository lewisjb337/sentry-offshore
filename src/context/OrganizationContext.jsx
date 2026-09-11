import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';

import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const OrganizationContext = createContext(null);

function mapMembership(row) {
    return row
        ? {
            id: row.id,
            organizationId: row.organization_id,
            userId: row.user_id,
            role: row.role,
            joinedAt: row.joined_at,
        }
        : null;
}

export function OrganizationProvider({ children }) {
    const { user, loading: authLoading } = useAuth();

    const [organization, setOrganization] = useState(null);
    const [membership, setMembership] = useState(null);
    const [profile, setProfile] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const refreshOrganization = useCallback(async () => {
        if (authLoading) {
            return;
        }

        if (!user) {
            setOrganization(null);
            setMembership(null);
            setProfile(null);
            setMembers([]);
            setError(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const [profileResult, membershipResult] = await Promise.all([
                supabase
                    .from('profiles')
                    .select('id,email,full_name,avatar_url,created_at,updated_at')
                    .eq('id', user.id)
                    .maybeSingle(),
                supabase
                    .from('organization_members')
                    .select(`
                        id,
                        organization_id,
                        user_id,
                        role,
                        joined_at,
                        organizations (
                            id,
                            name,
                            slug,
                            plan,
                            subscription_status,
                            created_at,
                            updated_at
                        )
                    `)
                    .eq('user_id', user.id)
                    .order('joined_at', { ascending: true })
                    .limit(1)
                    .maybeSingle(),
            ]);

            if (profileResult.error) {
                throw profileResult.error;
            }

            if (membershipResult.error) {
                throw membershipResult.error;
            }

            const membershipRow = membershipResult.data;
            const activeOrganization = membershipRow?.organizations ?? null;

            setProfile(profileResult.data ?? null);
            setMembership(mapMembership(membershipRow));
            setOrganization(activeOrganization);

            if (!activeOrganization?.id) {
                setMembers([]);
                return;
            }

            const { data: memberRows, error: membersError } = await supabase
                .from('organization_members')
                .select('id,organization_id,user_id,role,joined_at')
                .eq('organization_id', activeOrganization.id)
                .order('joined_at', { ascending: true });

            if (membersError) {
                throw membersError;
            }

            const userIds = [...new Set((memberRows ?? []).map((item) => item.user_id))];
            let profilesById = {};

            if (userIds.length > 0) {
                const { data: profileRows, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id,email,full_name,avatar_url')
                    .in('id', userIds);

                if (profilesError) {
                    throw profilesError;
                }

                profilesById = Object.fromEntries(
                    (profileRows ?? []).map((item) => [item.id, item]),
                );
            }

            setMembers(
                (memberRows ?? []).map((item) => ({
                    ...mapMembership(item),
                    profile: profilesById[item.user_id] ?? null,
                })),
            );
        } catch (loadError) {
            setError(loadError);
            setOrganization(null);
            setMembership(null);
            setMembers([]);
            throw loadError;
        } finally {
            setLoading(false);
        }
    }, [user, authLoading]);

    useEffect(() => {
        refreshOrganization().catch((loadError) => {
            console.error('Unable to load organization context:', loadError);
        });
    }, [refreshOrganization]);

    const updateProfile = useCallback(async ({ fullName, avatarUrl }) => {
        if (!user?.id) {
            throw new Error('Authentication required.');
        }

        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                full_name: fullName?.trim() || '',
                avatar_url: avatarUrl?.trim() || null,
            })
            .eq('id', user.id);

        if (updateError) {
            throw updateError;
        }

        await refreshOrganization();
    }, [user?.id, refreshOrganization]);

    const updateOrganization = useCallback(async ({ name, slug }) => {
        if (!organization?.id) {
            throw new Error('No active organization.');
        }

        const normalizedName = name?.trim();
        const normalizedSlug = slug
            ?.trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        if (!normalizedName || normalizedName.length < 2) {
            throw new Error('Organization name must contain at least 2 characters.');
        }

        if (!normalizedSlug || normalizedSlug.length < 2) {
            throw new Error('Organization slug must contain at least 2 characters.');
        }

        const { error: updateError } = await supabase
            .from('organizations')
            .update({
                name: normalizedName,
                slug: normalizedSlug,
            })
            .eq('id', organization.id);

        if (updateError) {
            throw updateError;
        }

        await refreshOrganization();
    }, [organization?.id, refreshOrganization]);

    const createOrganization = useCallback(async ({ name, slug }) => {
        if (!user?.id) {
            throw new Error('Authentication required.');
        }

        if (organization?.id) {
            throw new Error('This account already has an active organization.');
        }

        const { error: createError } = await supabase.rpc(
            'create_organization',
            {
                p_name: name?.trim(),
                p_slug: slug?.trim() || null,
            },
        );

        if (createError) {
            throw createError;
        }

        await refreshOrganization();
    }, [user?.id, organization?.id, refreshOrganization]);

    const permissions = useMemo(() => {
        const role = membership?.role;

        return {
            isOwner: role === 'owner',
            canManageOrganization: role === 'owner' || role === 'admin',
            canManagePeople: role === 'owner' || role === 'admin' || role === 'manager',
            canManageFleet: role === 'owner' || role === 'admin' || role === 'manager',
            canOperate:
                role === 'owner' ||
                role === 'admin' ||
                role === 'manager' ||
                role === 'operator',
            canVoidOperationalRecords:
                role === 'owner' || role === 'admin' || role === 'manager',
            canViewAudit:
                role === 'owner' || role === 'admin' || role === 'manager',
            canView: Boolean(role),
        };
    }, [membership]);

    const displayNameForUser = useCallback((userId) => {
        if (!userId) {
            return '—';
        }

        const member = members.find((item) => item.userId === userId);
        const memberProfile = member?.profile;

        if (memberProfile?.full_name?.trim()) {
            return memberProfile.full_name.trim();
        }

        if (memberProfile?.email) {
            return memberProfile.email;
        }

        if (userId === user?.id) {
            return profile?.full_name?.trim() || profile?.email || user.email || 'Current user';
        }

        return 'Team member';
    }, [members, profile, user]);

    return (
        <OrganizationContext.Provider
            value={{
                organization,
                membership,
                profile,
                members,
                role: membership?.role ?? null,
                loading,
                error,
                refreshOrganization,
                updateProfile,
                updateOrganization,
                createOrganization,
                displayNameForUser,
                ...permissions,
            }}
        >
            {children}
        </OrganizationContext.Provider>
    );
}

export function useOrganization() {
    const context = useContext(OrganizationContext);

    if (!context) {
        throw new Error('useOrganization must be used inside an OrganizationProvider');
    }

    return context;
}
