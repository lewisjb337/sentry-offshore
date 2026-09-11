import { Navigate, Link, useLocation } from 'react-router-dom';
import AuthForm from '../components/auth/AuthForm';
import { useAuth } from '../context/AuthContext';

function AuthPage() {
    const location = useLocation();

    const initialMode =
        location.pathname === '/signup'
            ? 'signup'
            : 'login';

    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="app-loading">
                <span>Loading Sentry...</span>
            </div>
        );
    }

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <main className="auth-page">
            <div className="auth-page__grid">
                <section className="auth-brand">
                    <Link
                        to="/"
                        className="brand auth-brand__logo"
                        aria-label="Sentry Offshore home"
                    >
                        <img
                            src="/assets/brand/sentry-icon-512.png"
                            alt=""
                            className="brand__logo"
                        />

                        <span className="brand__name">
                            Sentry Offshore
                        </span>
                    </Link>

                    <div className="auth-brand__content">
                        <p className="label">
                            offshore operations
                        </p>

                        <h1>
                            Know who's on board.
                        </h1>

                        <p>
                            Sign in to manage your people,
                            vessels, movements, musters and
                            reports from one operational view.
                        </p>
                    </div>

                    <div className="auth-brand__status">
                        <span className="status-dot" />

                        <span className="mono">
                            Sentry systems operational
                        </span>
                    </div>
                </section>

                <section className="auth-panel">
                    <AuthForm
                        initialMode={initialMode}
                        key={initialMode}
                    />
                </section>
            </div>
        </main>
    );
}

export default AuthPage;