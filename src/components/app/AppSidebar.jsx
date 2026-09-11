import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useOrganization } from '../../context/OrganizationContext';

const navigation = [
    {
        label: 'Overview',
        to: '/dashboard',
        icon: 'ti-layout-dashboard',
    },
    {
        label: 'People',
        to: '/people',
        icon: 'ti-users',
    },
    {
        label: 'Vessels',
        to: '/vessels',
        icon: 'ti-ship',
    },
    {
        label: 'Movements',
        to: '/movements',
        icon: 'ti-route',
    },
    {
        label: 'Operations',
        to: '/operations',
        icon: 'ti-clipboard-check',
    },
    {
        label: 'Reports',
        to: '/reports',
        icon: 'ti-file-export',
    },
    {
        label: 'Settings',
        to: '/settings',
        icon: 'ti-settings',
    },
];

function AppSidebar() {
    const {
        user,
        signOut,
    } = useAuth();

    const {
        organization,
        profile,
    } = useOrganization();

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error(
                'Unable to sign out:',
                error,
            );
        }
    };

    return (
        <aside className="app-sidebar">
            <NavLink
                to="/dashboard"
                className="app-sidebar__brand"
            >
                <img
                    src="/assets/brand/sentry-icon-512.png"
                    alt=""
                    className="app-sidebar__logo"
                />

                <span>
                    Sentry Offshore
                </span>
            </NavLink>

            <nav
                className="app-nav"
                aria-label="Application navigation"
            >
                {navigation.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `app-nav__item ${
                                isActive
                                    ? 'app-nav__item--active'
                                    : ''
                            }`
                        }
                    >
                        <i
                            className={`ti ${item.icon}`}
                            aria-hidden="true"
                        />

                        <span>
                            {item.label}
                        </span>
                    </NavLink>
                ))}
            </nav>

            <div className="app-sidebar__footer">
                <div className="app-account">
                    <span className="app-account__avatar">
                        {(profile?.full_name || user?.email)
                            ?.charAt(0)
                            ?.toUpperCase() || 'S'}
                    </span>

                    <div className="app-account__details">
                        <span className="app-account__email">
                            {profile?.full_name || user?.email}
                        </span>

                        <span className="app-account__plan">
                            {organization?.name || 'No organization'} · {organization?.plan || 'free'}
                        </span>
                    </div>
                </div>

                <button
                    type="button"
                    className="app-signout"
                    onClick={handleSignOut}
                >
                    <i
                        className="ti ti-logout"
                        aria-hidden="true"
                    />

                    Sign out
                </button>
            </div>
        </aside>
    );
}

export default AppSidebar;