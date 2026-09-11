import { differentiators } from '../data/landingPage';
import SectionLabel from './shared/SectionLabel';

function Differentiators() {
    return (
        <section className="differentiators">
            <div className="container">
                <div className="section-heading">
                    <SectionLabel>
                        why sentry offshore
                    </SectionLabel>
                </div>

                <div className="differentiator-grid">
                    {differentiators.map((item) => (
                        <div
                            key={item.title}
                            className="differentiator"
                        >
                            <h3>{item.title}</h3>

                            <p>{item.detail}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default Differentiators;