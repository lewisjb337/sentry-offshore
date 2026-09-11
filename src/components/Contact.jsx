import SectionLabel from './shared/SectionLabel';

function Contact() {
    const handleSubmit = (event) => {
        event.preventDefault();
    };

    return (
        <section
            id="contact"
            className="section"
        >
            <div className="container contact-grid">
                <div className="contact-copy">
                    <SectionLabel>
                        contact
                    </SectionLabel>

                    <h2>
                        Questions before you sign up?
                    </h2>

                    <p>
                        Ask anything about the platform,
                        pricing, or whether Sentry fits your
                        fleet. We read every message ourselves.
                    </p>

                    <a
                        href="mailto:hello@sentryoffshore.com"
                        className="contact-email"
                    >
                        <i
                            className="ti ti-mail"
                            aria-hidden="true"
                        />

                        hello@sentryoffshore.com
                    </a>
                </div>

                <form
                    className="panel contact-form"
                    onSubmit={handleSubmit}
                >
                    <label>
                        <span className="label">
                            Name
                        </span>

                        <input
                            className="input"
                            type="text"
                            name="name"
                            autoComplete="name"
                            placeholder="Your name"
                        />
                    </label>

                    <label>
                        <span className="label">
                            Email
                        </span>

                        <input
                            className="input"
                            type="email"
                            name="email"
                            autoComplete="email"
                            placeholder="you@company.com"
                        />
                    </label>

                    <label>
                        <span className="label">
                            Company / fleet size
                        </span>

                        <input
                            className="input"
                            type="text"
                            name="company"
                            autoComplete="organization"
                            placeholder="Company name / number of vessels"
                        />
                    </label>

                    <label>
                        <span className="label">
                            Message
                        </span>

                        <textarea
                            className="input"
                            name="message"
                            rows={4}
                            placeholder="How can we help?"
                        />
                    </label>

                    <button
                        type="submit"
                        className="btn btn--primary"
                    >
                        Send message
                    </button>
                </form>
            </div>
        </section>
    );
}

export default Contact;