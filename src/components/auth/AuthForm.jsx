import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

function AuthForm({ initialMode = 'login' }) {
    const navigate = useNavigate();

    const [mode, setMode] = useState(initialMode);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const isSignup = mode === 'signup';

    const resetFeedback = () => {
        setMessage('');
        setError('');
    };

    const switchMode = (nextMode) => {
        setMode(nextMode);
        setPassword('');
        setConfirmPassword('');
        resetFeedback();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        resetFeedback();

        if (!email || !password) {
            setError('Enter your email and password.');
            return;
        }

        if (isSignup && password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        if (isSignup && password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);

        try {
            if (isSignup) {
                const { data, error: signUpError } =
                    await supabase.auth.signUp({
                        email,
                        password,
                        options: {
                            emailRedirectTo:
                                `${window.location.origin}/auth/callback`,
                        },
                    });

                if (signUpError) {
                    throw signUpError;
                }

                if (data.session) {
                    navigate('/dashboard');
                    return;
                }

                setMessage(
                    'Account created. Check your email to confirm your address.'
                );

                return;
            }

            const { error: loginError } =
                await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

            if (loginError) {
                throw loginError;
            }

            navigate('/dashboard');
        } catch (err) {
            setError(
                err?.message ||
                'Something went wrong. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        resetFeedback();

        if (!email) {
            setError(
                'Enter your email first, then select forgot password.'
            );
            return;
        }

        setLoading(true);

        try {
            const { error: resetError } =
                await supabase.auth.resetPasswordForEmail(
                    email,
                    {
                        redirectTo:
                            `${window.location.origin}/reset-password`,
                    }
                );

            if (resetError) {
                throw resetError;
            }

            setMessage(
                'Password reset email sent. Check your inbox.'
            );
        } catch (err) {
            setError(
                err?.message ||
                'Unable to send password reset email.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-card">
            <div className="auth-card__heading">
                <p className="label">
                    {isSignup
                        ? 'create account'
                        : 'welcome back'}
                </p>

                <h2>
                    {isSignup
                        ? 'Create your Sentry account'
                        : 'Log in to Sentry'}
                </h2>

                <p>
                    {isSignup
                        ? 'Set up your account and start building your fleet.'
                        : 'Enter your account details to continue.'}
                </p>
            </div>

            <div className="auth-tabs">
                <button
                    type="button"
                    className={`auth-tab ${
                        mode === 'login'
                            ? 'auth-tab--active'
                            : ''
                    }`}
                    onClick={() => switchMode('login')}
                >
                    Log in
                </button>

                <button
                    type="button"
                    className={`auth-tab ${
                        mode === 'signup'
                            ? 'auth-tab--active'
                            : ''
                    }`}
                    onClick={() => switchMode('signup')}
                >
                    Sign up
                </button>
            </div>

            <form
                className="auth-form"
                onSubmit={handleSubmit}
            >
                <label className="field">
                    <span className="label">
                        Email
                    </span>

                    <input
                        className="input"
                        type="email"
                        autoComplete="email"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(event) =>
                            setEmail(event.target.value)
                        }
                        disabled={loading}
                    />
                </label>

                <label className="field">
                    <span className="label">
                        Password
                    </span>

                    <input
                        className="input"
                        type="password"
                        autoComplete={
                            isSignup
                                ? 'new-password'
                                : 'current-password'
                        }
                        placeholder="Enter your password"
                        value={password}
                        onChange={(event) =>
                            setPassword(event.target.value)
                        }
                        disabled={loading}
                    />
                </label>

                {isSignup && (
                    <label className="field">
                        <span className="label">
                            Confirm password
                        </span>

                        <input
                            className="input"
                            type="password"
                            autoComplete="new-password"
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(event) =>
                                setConfirmPassword(
                                    event.target.value
                                )
                            }
                            disabled={loading}
                        />
                    </label>
                )}

                {!isSignup && (
                    <div className="auth-form__meta">
                        <button
                            type="button"
                            className="auth-link"
                            onClick={handleForgotPassword}
                            disabled={loading}
                        >
                            Forgot password?
                        </button>
                    </div>
                )}

                {error && (
                    <div
                        className="auth-message auth-message--error"
                        role="alert"
                    >
                        <i
                            className="ti ti-alert-circle"
                            aria-hidden="true"
                        />

                        <span>
                            {error}
                        </span>
                    </div>
                )}

                {message && (
                    <div
                        className="auth-message auth-message--success"
                        role="status"
                    >
                        <i
                            className="ti ti-circle-check"
                            aria-hidden="true"
                        />

                        <span>
                            {message}
                        </span>
                    </div>
                )}

                <button
                    type="submit"
                    className="btn btn--primary auth-submit"
                    disabled={loading}
                >
                    {loading
                        ? 'Please wait…'
                        : isSignup
                            ? 'Create account'
                            : 'Log in'}
                </button>
            </form>

            <p className="auth-card__footer">
                {isSignup
                    ? 'Already have an account?'
                    : 'New to Sentry?'}

                {' '}

                <button
                    type="button"
                    className="auth-link"
                    onClick={() =>
                        switchMode(
                            isSignup
                                ? 'login'
                                : 'signup'
                        )
                    }
                >
                    {isSignup
                        ? 'Log in'
                        : 'Create an account'}
                </button>
            </p>
        </div>
    );
}

export default AuthForm;