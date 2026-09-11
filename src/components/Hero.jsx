import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RadarGraphic from './shared/RadarGraphic';

function Hero() {
    const {
        isAuthenticated,
        loading,
    } = useAuth();

    const primaryDestination = isAuthenticated
        ? '/dashboard'
        : '/signup';

    const primaryLabel = isAuthenticated
        ? 'View Dashboard'
        : 'Start free';

    return (
        <section className="section section--hero">
            <div className="container hero-grid">
                <div className="hero-copy">
                    <p className="label hero-eyebrow">
                        Crew operations for offshore fleets
                    </p>

                    <h1>
                        Know who's on board, right now.
                    </h1>

                    <p className="hero-copy__lead">
                        People, vessels, movements, operations
                        and reports. Tracked in real time, not
                        reconstructed at the end of the day.
                    </p>

                    <div className="hero-actions">
                        {!loading && (
                            <Link
                                to={primaryDestination}
                                className="btn btn--primary"
                            >
                                {primaryLabel}
                            </Link>
                        )}

                        <a
                            href="#features"
                            className="btn btn--secondary"
                        >
                            See how it works
                        </a>
                    </div>
                </div>

                <div className="hero-instrument">
                    <div className="hero-live">
                        <span className="status-dot" />

                        <span className="label">
                            Live fleet status
                        </span>
                    </div>

                    <div className="hero-radar">
                        <RadarGraphic />
                    </div>

                    <div className="hero-status">
                        <div className="hero-status__item">
                            <span className="label">
                                Active vessels
                            </span>

                            <span className="hero-status__value">
                                3
                            </span>
                        </div>

                        <div className="hero-status__item">
                            <span className="label">
                                Current POB
                            </span>

                            <span className="hero-status__value">
                                45
                            </span>
                        </div>

                        <div className="hero-status__item">
                            <span className="label">
                                Discrepancies
                            </span>

                            <span
                                className="hero-status__value"
                                style={{
                                    color: 'var(--color-success)',
                                }}
                            >
                                0
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Hero;