import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Activity, Sparkles, Zap, Shield, BarChart3 } from 'lucide-react';
import './Hero.css';

const Hero = () => {
    // Animation variants for staggering children
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1]
            }
        }
    };

    const floatingTransition = {
        duration: 4,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut"
    };

    return (
        <section id="home" className="hero-section">
            <div className="hero-background-effects">
                <div className="glow-sphere glow-1"></div>
                <div className="glow-sphere glow-2"></div>
                <div className="mesh-gradient"></div>
            </div>

            <div className="container">
                <div className="hero-wrapper">
                    <motion.div
                        className="hero-content"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <motion.div
                            variants={itemVariants}
                            className="hero-badge-wrapper"
                        >
                            <div className="hero-badge">
                                <Sparkles size={14} className="badge-icon" />
                                <span>Powered by Next-Gen AI Models</span>
                            </div>
                        </motion.div>

                        <motion.h1 variants={itemVariants} className="hero-title">
                            Decode the <span className="gradient-text">Emotional DNA</span> of the Digital World
                        </motion.h1>

                        <motion.p variants={itemVariants} className="hero-desc">
                            SentimentIQ leverages state-of-the-art GPT-4o and RoBERTa architectures to extract high-fidelity emotional intelligence from fragmented social data.
                        </motion.p>

                        <motion.div variants={itemVariants} className="hero-actions">
                            <button
                                onClick={() => {
                                    const token = localStorage.getItem('token');
                                    window.location.href = token ? '/dashboard' : '/login';
                                }}
                                className="btn btn-primary hero-main-btn"
                            >
                                Start Free Analysis <ArrowRight size={20} className="btn-icon" />
                            </button>
                            <a href="#features" className="btn btn-glass">
                                <Activity size={18} /> Explore Capabilities
                            </a>
                        </motion.div>

                        <motion.div
                            variants={itemVariants}
                            className="trust-indicators"
                        >
                            <div className="trust-item">
                                <div className="trust-icon"><Shield size={16} /></div>
                                <span>ISO 27001 Secure</span>
                            </div>
                            <div className="trust-divider"></div>
                            <div className="trust-item">
                                <div className="trust-icon"><Zap size={16} /></div>
                                <span>&lt; 200ms Latency</span>
                            </div>
                            <div className="trust-divider"></div>
                            <div className="trust-item">
                                <div className="trust-icon"><BarChart3 size={16} /></div>
                                <span>99.2% NLP Precision</span>
                            </div>
                        </motion.div>
                    </motion.div>

                    <motion.div
                        className="hero-visual-wrapper"
                        initial={{ opacity: 0, scale: 0.9, x: 50 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <div className="hero-visual-container">
                            <motion.div 
                                className="main-visual-card glass"
                                animate={{ y: [0, -15, 0] }}
                                transition={floatingTransition}
                            >
                                <div className="card-top-bar">
                                    <div className="window-controls">
                                        <span></span><span></span><span></span>
                                    </div>
                                    <div className="window-title">live_sentiment_stream.exe</div>
                                </div>
                                <div className="card-inner-ui">
                                    <div className="ui-skeleton-header"></div>
                                    <div className="ui-skeleton-grid">
                                        <div className="skeleton-item h-24"></div>
                                        <div className="skeleton-item h-24"></div>
                                    </div>
                                    <div className="ui-skeleton-chart"></div>
                                </div>
                                
                                {/* Floating Overlay Elements */}
                                <motion.div 
                                    className="floating-tag tag-1"
                                    animate={{ x: [0, 10, 0], y: [0, -10, 0] }}
                                    transition={{ ...floatingTransition, duration: 3 }}
                                >
                                    <div className="tag-dot pos"></div> 92% Positive
                                </motion.div>
                                
                                <motion.div 
                                    className="floating-tag tag-2"
                                    animate={{ x: [0, -8, 0], y: [0, 12, 0] }}
                                    transition={{ ...floatingTransition, duration: 4.5 }}
                                >
                                    <div className="tag-dot neg"></div> 4% Negative
                                </motion.div>

                                <motion.div 
                                    className="floating-graph-node"
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ ...floatingTransition, duration: 2.5 }}
                                >
                                    <Activity size={24} color="var(--primary)" />
                                </motion.div>
                            </motion.div>

                            <div className="visual-background-glow"></div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default Hero;

