import React, { useState, useEffect } from 'react';
import { Menu, X, BarChart2, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = () => {
            setIsLoggedIn(!!localStorage.getItem('token'));
        };
        window.addEventListener('storage', checkAuth);
        return () => window.removeEventListener('storage', checkAuth);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleNavigation = (hash) => {
        if (location.pathname !== '/') {
            navigate('/');
            setTimeout(() => {
                const element = document.querySelector(hash);
                if (element) element.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } else {
            const element = document.querySelector(hash);
            if (element) element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const navLinks = [
        { name: 'Home', href: '#home' },
        { name: 'Features', href: '#features' },
        { name: 'Process', href: '#how-it-works' },
        { name: 'Cases', href: '#use-cases' },
    ];

    return (
        <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
            <div className="container navbar-container">
                <Link to="/" className="logo">
                    <div className="logo-icon glass">
                        <BarChart2 size={20} className="text-primary" />
                    </div>
                    <span className="logo-text">
                        Sentiment<span>IQ</span>
                    </span>
                </Link>

                {/* Desktop Nav */}
                <div className="nav-links">
                    {navLinks.map((link) => (
                        <a
                            key={link.name}
                            href={link.href}
                            className="nav-link"
                            onClick={(e) => {
                                e.preventDefault();
                                handleNavigation(link.href);
                            }}
                        >
                            {link.name}
                        </a>
                    ))}
                </div>

                <div className="nav-actions">
                    {isLoggedIn ? (
                        <div className="auth-group">
                            <Link to="/dashboard" className="nav-link">Dashboard</Link>
                            <button
                                className="nav-btn-logout"
                                onClick={() => {
                                    localStorage.removeItem('token');
                                    setIsLoggedIn(false);
                                    navigate('/');
                                }}
                            >
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <div className="auth-group">
                            <Link to="/login" className="nav-link">Sign In</Link>
                            <Link to="/signup" className="btn btn-primary nav-btn">
                                Join Now
                            </Link>
                        </div>
                    )}
                </div>

                <button
                    className="mobile-toggle"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Nav */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="mobile-menu glass"
                    >
                        <div className="container mobile-menu-container">
                            {navLinks.map((link) => (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    className="mobile-link"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setIsOpen(false);
                                        handleNavigation(link.href);
                                    }}
                                >
                                    {link.name}
                                </a>
                            ))}
                            <div className="mobile-divider"></div>
                            {isLoggedIn ? (
                                <button
                                    className="btn btn-outline"
                                    onClick={() => {
                                        localStorage.removeItem('token');
                                        setIsLoggedIn(false);
                                        setIsOpen(false);
                                        navigate('/');
                                    }}
                                >
                                    Logout
                                </button>
                            ) : (
                                <div className="mobile-actions">
                                    <Link to="/login" className="mobile-link" onClick={() => setIsOpen(false)}>Login</Link>
                                    <Link to="/signup" className="btn btn-primary" onClick={() => setIsOpen(false)}>Get Started</Link>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;

