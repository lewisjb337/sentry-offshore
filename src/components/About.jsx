import SectionLabel from './shared/SectionLabel';

function About() {
    return (
        <section
            id="about"
            className="band section"
        >
            <div className="container about-grid">
                <div>
                    <SectionLabel>
                        about
                    </SectionLabel>

                    <h2>
                        Built for the operator, not the enterprise.
                    </h2>
                </div>

                <div className="about-copy">
                    <p>
                        Most crew operations software in this
                        industry is built for one of two
                        extremes: large offshore programmes
                        running hundred-person rotations, or
                        yacht-management systems designed
                        around guests and visitors.
                    </p>

                    <p>
                        Sentry Offshore is built for operators
                        running CTVs, SOVs and workboats who
                        need a clear operational picture
                        without deploying an enterprise
                        platform.
                    </p>

                    <p>
                        People, vessels, movements, operations
                        and reports sit at the core. If a
                        feature doesn't obviously belong to one
                        of those five, we treat that as a
                        reason to question the feature, not
                        automatically add another module.
                    </p>
                </div>
            </div>
        </section>
    );
}

export default About;