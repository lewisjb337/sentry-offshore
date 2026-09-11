import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '../context/AuthContext';
import { useOrganization } from '../context/OrganizationContext';

function SettingsPage() {
    const { user } = useAuth();
    const {
        organization,
        profile,
        role,
        members,
        canManageOrganization,
        updateProfile,
        updateOrganization,
        createOrganization,
    } = useOrganization();

    const [profileForm, setProfileForm] = useState({
        fullName: '',
        avatarUrl: '',
    });

    const [organizationForm, setOrganizationForm] = useState({
        name: '',
        slug: '',
    });

    const [profileState, setProfileState] = useState({ saving: false, message: '', error: '' });
    const [organizationState, setOrganizationState] = useState({ saving: false, message: '', error: '' });

    useEffect(() => {
        setProfileForm({
            fullName: profile?.full_name || '',
            avatarUrl: profile?.avatar_url || '',
        });
    }, [profile]);

    useEffect(() => {
        setOrganizationForm({
            name: organization?.name || '',
            slug: organization?.slug || '',
        });
    }, [organization]);

    const initials = useMemo(() => {
        const source = profileForm.fullName?.trim() || user?.email || 'S';
        return source
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase())
            .join('');
    }, [profileForm.fullName, user?.email]);

    const submitProfile = async (event) => {
        event.preventDefault();
        setProfileState({ saving: true, message: '', error: '' });

        try {
            await updateProfile(profileForm);
            setProfileState({ saving: false, message: 'Profile updated.', error: '' });
        } catch (error) {
            setProfileState({
                saving: false,
                message: '',
                error: error?.message || 'Unable to update profile.',
            });
        }
    };

    const submitOrganization = async (event) => {
        event.preventDefault();
        setOrganizationState({ saving: true, message: '', error: '' });

        try {
            if (organization?.id) {
                await updateOrganization(organizationForm);
            } else {
                await createOrganization(organizationForm);
            }

            setOrganizationState({
                saving: false,
                message: organization?.id ? 'Organization updated.' : 'Organization created.',
                error: '',
            });
        } catch (error) {
            setOrganizationState({
                saving: false,
                message: '',
                error: error?.message || 'Unable to save organization.',
            });
        }
    };

    return (
        <section className="settings-page">
            <header className="app-topbar">
                <div>
                    <p className="label">Account & organization</p>
                    <h1>Settings</h1>
                </div>

                <span className="app-plan-badge">
                    {organization?.plan || 'free'} plan
                </span>
            </header>

            <div className="settings-grid">
                <article className="panel settings-card">
                    <div className="settings-card__heading">
                        <div className="settings-avatar" aria-hidden="true">
                            {initials || 'S'}
                        </div>
                        <div>
                            <p className="label">Personal profile</p>
                            <h2>Your details</h2>
                            <p>Used to identify who created, changed and signed off operational records.</p>
                        </div>
                    </div>

                    <form className="settings-form" onSubmit={submitProfile}>
                        <label className="field">
                            <span className="label">Full name</span>
                            <input
                                className="input"
                                value={profileForm.fullName}
                                onChange={(event) => setProfileForm((current) => ({
                                    ...current,
                                    fullName: event.target.value,
                                }))}
                                placeholder="Your full name"
                                autoComplete="name"
                            />
                        </label>

                        <label className="field">
                            <span className="label">Email</span>
                            <input
                                className="input"
                                value={user?.email || ''}
                                readOnly
                                aria-readonly="true"
                            />
                            <small className="settings-help">Email changes are managed through authentication, not the public profile row.</small>
                        </label>

                        <label className="field">
                            <span className="label">Avatar URL</span>
                            <input
                                className="input"
                                type="url"
                                value={profileForm.avatarUrl}
                                onChange={(event) => setProfileForm((current) => ({
                                    ...current,
                                    avatarUrl: event.target.value,
                                }))}
                                placeholder="https://…"
                            />
                        </label>

                        {(profileState.error || profileState.message) && (
                            <p className={profileState.error ? 'settings-feedback settings-feedback--error' : 'settings-feedback'}>
                                {profileState.error || profileState.message}
                            </p>
                        )}

                        <div className="settings-actions">
                            <button className="btn btn--primary" type="submit" disabled={profileState.saving}>
                                {profileState.saving ? 'Saving…' : 'Save profile'}
                            </button>
                        </div>
                    </form>
                </article>

                <article className="panel settings-card">
                    <div className="settings-card__heading">
                        <span className="settings-card__icon">
                            <i className="ti ti-building" aria-hidden="true" />
                        </span>
                        <div>
                            <p className="label">Organization</p>
                            <h2>{organization?.id ? 'Organization details' : 'Create organization'}</h2>
                            <p>
                                {organization?.id
                                    ? 'These details identify the tenant that owns your vessels, personnel and operational records.'
                                    : 'Create the tenant that will own your vessels, people and operational history.'}
                            </p>
                        </div>
                    </div>

                    <form className="settings-form" onSubmit={submitOrganization}>
                        <label className="field">
                            <span className="label">Organization name</span>
                            <input
                                className="input"
                                value={organizationForm.name}
                                onChange={(event) => setOrganizationForm((current) => ({
                                    ...current,
                                    name: event.target.value,
                                }))}
                                placeholder="Sentry Demo"
                                disabled={Boolean(organization?.id) && !canManageOrganization}
                            />
                        </label>

                        <label className="field">
                            <span className="label">Slug</span>
                            <input
                                className="input"
                                value={organizationForm.slug}
                                onChange={(event) => setOrganizationForm((current) => ({
                                    ...current,
                                    slug: event.target.value,
                                }))}
                                placeholder="sentry-demo"
                                disabled={Boolean(organization?.id) && !canManageOrganization}
                            />
                            <small className="settings-help">Lowercase letters, numbers and hyphens only. Must be unique.</small>
                        </label>

                        {organization?.id && (
                            <div className="settings-meta-grid">
                                <div>
                                    <span className="label">Your role</span>
                                    <strong>{role || '—'}</strong>
                                </div>
                                <div>
                                    <span className="label">Members</span>
                                    <strong>{members.length}</strong>
                                </div>
                                <div>
                                    <span className="label">Plan</span>
                                    <strong>{organization.plan || 'free'}</strong>
                                </div>
                            </div>
                        )}

                        {organization?.id && !canManageOrganization && (
                            <p className="settings-notice">
                                Only organization owners and administrators can change organization details.
                            </p>
                        )}

                        {(organizationState.error || organizationState.message) && (
                            <p className={organizationState.error ? 'settings-feedback settings-feedback--error' : 'settings-feedback'}>
                                {organizationState.error || organizationState.message}
                            </p>
                        )}

                        {(!organization?.id || canManageOrganization) && (
                            <div className="settings-actions">
                                <button className="btn btn--primary" type="submit" disabled={organizationState.saving}>
                                    {organizationState.saving
                                        ? 'Saving…'
                                        : organization?.id
                                            ? 'Save organization'
                                            : 'Create organization'}
                                </button>
                            </div>
                        )}
                    </form>
                </article>

                <article className="panel settings-card settings-card--wide">
                    <div className="settings-card__heading">
                        <span className="settings-card__icon">
                            <i className="ti ti-shield-lock" aria-hidden="true" />
                        </span>
                        <div>
                            <p className="label">Data protection</p>
                            <h2>Tenant & audit controls</h2>
                            <p>Sentry treats operational history differently from editable master data.</p>
                        </div>
                    </div>

                    <div className="settings-security-list">
                        <div>
                            <i className="ti ti-lock" aria-hidden="true" />
                            <span><strong>Organization isolation</strong><small>Database Row Level Security checks organization membership on every tenant-owned table.</small></span>
                        </div>
                        <div>
                            <i className="ti ti-history" aria-hidden="true" />
                            <span><strong>Operational history</strong><small>Completed movements and completed/attention operations become immutable and can only be voided with a reason.</small></span>
                        </div>
                        <div>
                            <i className="ti ti-file-lock" aria-hidden="true" />
                            <span><strong>Generated reports</strong><small>Generated report snapshots are immutable audit records and cannot be edited or deleted from the client.</small></span>
                        </div>
                        <div>
                            <i className="ti ti-user-shield" aria-hidden="true" />
                            <span><strong>Sensitive audit access</strong><small>Audit history is restricted to owner, admin and manager roles to avoid leaking private personnel details.</small></span>
                        </div>
                    </div>
                </article>
            </div>
        </section>
    );
}

export default SettingsPage;
