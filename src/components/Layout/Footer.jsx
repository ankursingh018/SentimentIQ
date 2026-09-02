import React from 'react';
import { Twitter, Facebook, Instagram, Linkedin, Github, BarChart2 } from 'lucide-react';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-top">
                    <div className="footer-brand">
                        <div className="logo footer-logo">
                            <div className="logo-icon glass">
                                <BarChart2 size={20} className="text-primary" />
                            </div>
                            <span className="logo-text">Sentiment<span>IQ</span></span>
                        </div>
                        <p className="footer-bio">
                            Next-generation emotional intelligence platform.
                            Transforming the global social conversation into actionable business strategy.
                        </p>
                    </div>

                    <div className="footer-grid">
                        <div className="footer-col">
                            <h4>Solution</h4>
                            <ul className="footer-links">
                                <li><a href="#features">Features</a></li>
                                <li><a href="#how-it-works">Process</a></li>
                                <li><a href="#dashboard">Live View</a></li>
                                <li><a href="#use-cases">Use Cases</a></li>
                            </ul>
                        </div>

                        <div className="footer-col">
                            <h4>Support</h4>
                            <ul className="footer-links">
                                <li><a href="#">Documentation</a></li>
                                <li><a href="#">API Status</a></li>
                                <li><a href="#">Help Center</a></li>
                                <li><a href="#">Community</a></li>
                            </ul>
                        </div>

                        <div className="footer-col">
                            <h4>Socials</h4>
                            <div className="social-links">
                                <a href="#" className="social-icon"><Twitter size={18} /></a>
                                <a href="#" className="social-icon"><Facebook size={18} /></a>
                                <a href="#" className="social-icon"><Instagram size={18} /></a>
                                <a href="#" className="social-icon"><Github size={18} /></a>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p className="copyright">&copy; {new Date().getFullYear()} SentimentIQ. Engineered for Excellence.</p>
                    <div className="footer-legal">
                        <a href="#" className="legal-link">Privacy</a>
                        <a href="#" className="legal-link">Terms</a>
                        <a href="#" className="legal-link">Cookies</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

