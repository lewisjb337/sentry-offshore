import { Routes, Route } from 'react-router-dom';

import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

import DashboardPage from './pages/DashboardPage';
import PeoplePage from './pages/PeoplePage';
import VesselsPage from './pages/VesselsPage';
import MovementsPage from './pages/MovementsPage';
import OperationsPage from './pages/OperationsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './components/app/AppLayout';

function App() {
    return (
        <Routes>
            <Route
                path="/"
                element={<HomePage />}
            />

            <Route
                path="/login"
                element={<AuthPage />}
            />

            <Route
                path="/signup"
                element={<AuthPage />}
            />

            <Route
                path="/auth/callback"
                element={<AuthCallbackPage />}
            />

            <Route
                path="/reset-password"
                element={<ResetPasswordPage />}
            />

            <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                    <Route
                        path="/dashboard"
                        element={<DashboardPage />}
                    />

                    <Route
                        path="/people"
                        element={<PeoplePage />}
                    />

                    <Route
                        path="/vessels"
                        element={<VesselsPage />}
                    />

                    <Route
                        path="/movements"
                        element={<MovementsPage />}
                    />

                    <Route
                        path="/operations"
                        element={<OperationsPage />}
                    />

                    <Route
                        path="/reports"
                        element={<ReportsPage />}
                    />

                    <Route
                        path="/settings"
                        element={<SettingsPage />}
                    />
                </Route>
            </Route>
        </Routes>
    );
}

export default App;