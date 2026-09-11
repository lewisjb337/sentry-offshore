import { Link } from 'react-router-dom';
import { pricingTiers } from '../data/landingPage';
import { useAuth } from '../context/AuthContext';
import SectionLabel from './shared/SectionLabel';

function Pricing() {
    const {
        isAuthenticated,
        loading,
    } = useAuth();

    const getTierCta = (tier) => {
        if (loading) {
            return null;
        }

        if (!isAuthenticated) {
            return {
                label: tier.name === 'Free'
                    ? 'Start free'
                    : 'Choose plan',
                to: '/signup',
                disabled: false,
            };
        }

        if (tier.name === 'Free') {
            return {
                label: 'Current plan',
                to: '/dashboard',
                disabled: true,
            };
        }

        return {
            label: 'Upgrade',
            to: '/dashboard',
            disabled: false,
        };
    };

    return (
        <section
            id="pricing"
            className="section"
        >
            <div className="container">
                <div className="section-heading">
                    <SectionLabel>
                        pricing
                    </SectionLabel>

                    <h2>
                        Published pricing. No sales call required.
                    </h2>
                </div>

                <p className="pricing-intro">
                    Simple fleet pricing with unlimited crew,
                    because your crew count changes week to week
                    and your bill shouldn't.
                </p>

                <div className="pricing-grid">
                    {pricingTiers.map((tier) => {
                        const cta = getTierCta(tier);

                        return (
                            <article
                                key={tier.name}
                                className={`panel price-card ${
                                    tier.highlight
                                        ? 'price-card--highlight'
                                        : ''
                                }`}
                            >
                                {tier.highlight && (
                                    <span className="mono price-card__badge">
                                        MOST COMMON
                                    </span>
                                )}

                                <h3 className="price-card__name">
                                    {tier.name}
                                </h3>

                                <p className="price-card__description">
                                    {tier.description}
                                </p>

                                <div className="price-card__price">
                                    <span className="stat">
                                        {tier.price}
                                    </span>

                                    {tier.unit && (
                                        <span className="price-card__unit">
                                            {tier.unit}
                                        </span>
                                    )}
                                </div>

                                <div className="price-card__features">
                                    {tier.features.map(
                                        (feature) => (
                                            <div
                                                key={feature}
                                                className="price-card__feature"
                                            >
                                                <i
                                                    className="ti ti-check"
                                                    aria-hidden="true"
                                                />

                                                <span>
                                                    {feature}
                                                </span>
                                            </div>
                                        ),
                                    )}
                                </div>

                                {cta && (
                                    cta.disabled ? (
                                        <button
                                            type="button"
                                            className="btn btn--secondary"
                                            disabled
                                        >
                                            {cta.label}
                                        </button>
                                    ) : (
                                        <Link
                                            to={cta.to}
                                            className={`btn ${
                                                tier.highlight
                                                    ? 'btn--primary'
                                                    : 'btn--secondary'
                                            }`}
                                        >
                                            {cta.label}
                                        </Link>
                                    )
                                )}
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

export default Pricing;