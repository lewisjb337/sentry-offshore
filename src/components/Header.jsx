import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Header() {
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    const {
        isAuthenticated,
        loading,
    } = useAuth();

    const closeMobileNav = () => {
        setMobileNavOpen(false);
    };

    const navItems = [
        { label: 'Features', href: '#features' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'About', href: '#about' },
        { label: 'Contact', href: '#contact' },
    ];

    const primaryDestination = isAuthenticated
        ? '/dashboard'
        : '/signup';

    const primaryLabel = isAuthenticated
        ? 'View Dashboard'
        : 'Start Free';

    return (
        <header className="site-header">
            <div className="container site-header__inner">
                <Link
                    to="/"
                    className="brand"
                    onClick={closeMobileNav}
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

                <nav
                    className="site-nav"
                    aria-label="Main navigation"
                >
                    <div className="site-nav__links">
                        {navItems.map((item) => (
                            <a
                                key={item.href}
                                href={item.href}
                                className="nav-link"
                            >
                                {item.label}
                            </a>
                        ))}
                    </div>

                    {!loading && (
                        <>
                            <div className="site-nav__divider" />

                            <div className="site-nav__actions">
                                {!isAuthenticated && (
                                    <Link
                                        to="/login"
                                        className="nav-link"
                                    >
                                        Log in
                                    </Link>
                                )}

                                <Link
                                    to={primaryDestination}
                                    className="btn btn--primary"
                                >
                                    {primaryLabel}

                                    <i
                                        className="ti ti-arrow-up-right"
                                        aria-hidden="true"
                                    />
                                </Link>
                            </div>
                        </>
                    )}
                </nav>

                <button
                    type="button"
                    className="mobile-nav-toggle"
                    onClick={() =>
                        setMobileNavOpen((current) => !current)
                    }
                    aria-label={
                        mobileNavOpen
                            ? 'Close navigation'
                            : 'Open navigation'
                    }
                    aria-expanded={mobileNavOpen}
                    aria-controls="mobile-navigation"
                >
                    <i
                        className={
                            mobileNavOpen
                                ? 'ti ti-x'
                                : 'ti ti-menu-2'
                        }
                        aria-hidden="true"
                    />
                </button>
            </div>

            <div
                id="mobile-navigation"
                className={`mobile-nav ${
                    mobileNavOpen
                        ? 'is-open'
                        : ''
                }`}
            >
                <div className="container mobile-nav__inner">
                    {navItems.map((item) => (
                        <a
                            key={item.href}
                            href={item.href}
                            className="nav-link"
                            onClick={closeMobileNav}
                        >
                            {item.label}
                        </a>
                    ))}

                    {!loading && (
                        <div className="mobile-nav__actions">
                            {!isAuthenticated && (
                                <Link
                                    to="/login"
                                    className="btn btn--secondary"
                                    onClick={closeMobileNav}
                                >
                                    Log in
                                </Link>
                            )}

                            <Link
                                to={primaryDestination}
                                className="btn btn--primary"
                                onClick={closeMobileNav}
                            >
                                {primaryLabel}

                                <i
                                    className="ti ti-arrow-up-right"
                                    aria-hidden="true"
                                />
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Header;