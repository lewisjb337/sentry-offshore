function Footer() {
    return (
        <footer className="site-footer">
            <div className="container site-footer__inner">
                <span className="footer-brand">
                    Sentry Offshore
                </span>

                <nav
                    className="footer-links"
                    aria-label="Footer navigation"
                >
                    <a
                        href="#features"
                        className="nav-link"
                    >
                        Features
                    </a>

                    <a
                        href="#pricing"
                        className="nav-link"
                    >
                        Pricing
                    </a>

                    <a
                        href="#about"
                        className="nav-link"
                    >
                        About
                    </a>

                    <a
                        href="#contact"
                        className="nav-link"
                    >
                        Contact
                    </a>
                </nav>

                <p className="footer-copy">
                    © 2026 Sentry Offshore
                </p>
            </div>
        </footer>
    );
}

export default Footer;