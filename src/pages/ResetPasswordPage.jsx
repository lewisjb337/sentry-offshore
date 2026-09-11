import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function ResetPasswordPage() {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const submit = async (event) => {
        event.preventDefault();
        setError('');

        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setSaving(true);
        const { error: updateError } = await supabase.auth.updateUser({ password });
        setSaving(false);

        if (updateError) {
            setError(updateError.message || 'Unable to update password.');
            return;
        }

        navigate('/dashboard', { replace: true });
    };

    return (
        <main className="auth-page">
            <section className="auth-card">
                <div className="auth-card__heading">
                    <p className="label">Account security</p>
                    <h2>Set a new password</h2>
                    <p>Choose a new password for your Sentry account.</p>
                </div>

                <form className="auth-form" onSubmit={submit}>
                    <label className="field">
                        <span className="label">New password</span>
                        <input
                            className="input"
                            type="password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                        />
                    </label>

                    <label className="field">
                        <span className="label">Confirm password</span>
                        <input
                            className="input"
                            type="password"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                        />
                    </label>

                    {error && <div className="auth-message auth-message--error" role="alert">{error}</div>}

                    <button className="btn btn--primary" type="submit" disabled={saving}>
                        {saving ? 'Updating…' : 'Update password'}
                    </button>
                </form>
            </section>
        </main>
    );
}

export default ResetPasswordPage;
