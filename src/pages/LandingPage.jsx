import React from 'react';
import Hero from '../components/Sections/Hero';
import Features from '../components/Sections/Features';
import HowItWorks from '../components/Sections/HowItWorks';
import DashboardPreview from '../components/Sections/DashboardPreview';
import UseCases from '../components/Sections/UseCases';
import Footer from '../components/Layout/Footer';

const LandingPage = () => {
    return (
        <>
            <Hero />
            <Features />
            <HowItWorks />
            <DashboardPreview />
            <UseCases />
            <Footer />
        </>
    );
};

export default LandingPage;
