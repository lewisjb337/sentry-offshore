import { Navigate, Outlet, useLocation } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import { useOrganization } from '../../context/OrganizationContext';

function AppLayout() {
    const location = useLocation();
    const { organization, loading } = useOrganization();

    if (loading) {
        return (
            <div className="app-loading">
                <span>Loading Sentry...</span>
            </div>
        );
    }

    if (!organization && location.pathname !== '/settings') {
        return <Navigate to="/settings" replace />;
    }

    return (
        <div className="app-shell">
            <AppSidebar />

            <main className="app-main">
                <Outlet />
            </main>
        </div>
    );
}

export default AppLayout;
