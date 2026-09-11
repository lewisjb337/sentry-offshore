import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function AuthCallbackPage() {
    const navigate = useNavigate();

    useEffect(() => {
        let mounted = true;

        const finish = async () => {
            const { data, error } = await supabase.auth.getSession();

            if (!mounted) {
                return;
            }

            if (error || !data.session) {
                navigate('/login', { replace: true });
                return;
            }

            navigate('/dashboard', { replace: true });
        };

        finish();

        return () => {
            mounted = false;
        };
    }, [navigate]);

    return (
        <div className="app-loading">
            <span>Confirming your Sentry account…</span>
        </div>
    );
}

export default AuthCallbackPage;
