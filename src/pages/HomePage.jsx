import Header from '../components/Header';
import Hero from '../components/Hero';
import Differentiators from '../components/Differentiators';
import Features from '../components/Features';
import Pricing from '../components/Pricing';
import About from '../components/About';
import Contact from '../components/Contact';
import Footer from '../components/Footer';

function HomePage() {
    return (
        <>
            <Header />

            <main id="top">
                <Hero />
                <Differentiators />
                <Features />
                <Pricing />
                <About />
                <Contact />
            </main>

            <Footer />
        </>
    );
}

export default HomePage;