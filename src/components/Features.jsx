import { features } from '../data/landingPage';
import FeaturePreview from './shared/FeaturePreview';
import SectionLabel from './shared/SectionLabel';

function Features() {
    return (
        <section
            id="features"
            className="band section"
        >
            <div className="container">
                <div className="section-heading">
                    <SectionLabel>
                        features
                    </SectionLabel>

                    <h2>
                        Everything you need. Nothing you don't.
                    </h2>
                </div>

                <div className="feature-list">
                    {features.map((feature, index) => (
                        <article
                            key={feature.number}
                            className={`feature-row ${
                                index % 2 !== 0
                                    ? 'feature-row--reverse'
                                    : ''
                            }`}
                        >
                            <div className="feature-copy">
                                <p className="mono feature-number">
                                    {feature.number}
                                </p>

                                <div className="feature-title">
                                    <i
                                        className={`ti ${feature.icon}`}
                                        aria-hidden="true"
                                    />

                                    <h3>
                                        {feature.title}
                                    </h3>
                                </div>

                                <p className="feature-tagline">
                                    {feature.tagline}
                                </p>

                                <p className="feature-description">
                                    {feature.description}
                                </p>

                                <div className="feature-bullets">
                                    {feature.bullets.map(
                                        (bullet) => (
                                            <span
                                                key={bullet}
                                                className="mono feature-chip"
                                            >
                                                {bullet}
                                            </span>
                                        ),
                                    )}
                                </div>
                            </div>

                            <div className="feature-preview">
                                <FeaturePreview
                                    label={feature.preview.label}
                                    rows={feature.preview.rows}
                                />
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default Features;