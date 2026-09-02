import React from 'react';
import { motion } from 'framer-motion';
import { Share2, Zap, Brain, Heart, PieChart, Bell, Globe, Activity, Smartphone } from 'lucide-react';
import './Features.css';

const featuresList = [
    {
        icon: <Globe size={28} />,
        title: "Omni-Channel Stream",
        desc: "Unified ingestion from Bluesky, Mastodon, Lemmy and centralized APIs with zero-trust security.",
        color: "linear-gradient(135deg, #6366f1, #818cf8)"
    },
    {
        icon: <Zap size={28} />,
        title: "Edge Processing",
        desc: "Sentiment vectorization occurs at the edge, delivering sub-100ms insights for rapid response.",
        color: "linear-gradient(135deg, #a855f7, #c084fc)"
    },
    {
        icon: <Brain size={28} />,
        title: "GPT-4o Normalization",
        desc: "Advanced LLM cleaning removing algorithmic noise and synthetic activity for raw truth.",
        color: "linear-gradient(135deg, #22d3ee, #06b6d4)"
    },
    {
        icon: <Activity size={28} />,
        title: "Emotional Spectrum",
        desc: "Nuanced mapping of secondary emotions beyond basic valence: anticipation, trust, and dread.",
        color: "linear-gradient(135deg, #f43f5e, #fb7185)"
    },
    {
        icon: <PieChart size={28} />,
        title: "Pro Visualization",
        desc: "Complex data landscapes rendered into intuitive, stakeholder-ready visual intelligence.",
        color: "linear-gradient(135deg, #10b981, #34d399)"
    },
    {
        icon: <Bell size={28} />,
        title: "Crisis Guardrails",
        desc: "Predictive alerting utilizing historical patterns to identify PR risks before they escalate.",
        color: "linear-gradient(135deg, #f59e0b, #fbbf24)"
    }
];

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 30 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.8,
            ease: [0.16, 1, 0.3, 1]
        }
    }
};

const Features = () => {
    return (
        <section id="features" className="features-section">
            <div className="container">
                <div className="section-header">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="section-title">
                            Next-Generation <span className="gradient-text">Feature Matrix</span>
                        </h2>
                        <p className="section-desc">
                            Engineered for rapid response and deep analytical precision in the modern digital age.
                        </p>
                    </motion.div>
                </div>

                <motion.div
                    className="features-grid"
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-50px" }}
                >
                    {featuresList.map((feature, index) => (
                        <motion.div key={index} variants={item} className="feature-card">
                            <div className="feature-icon-box" style={{ background: feature.color }}>
                                {feature.icon}
                            </div>
                            <h3 className="feature-title">{feature.title}</h3>
                            <p className="feature-description">{feature.desc}</p>
                            <div className="feature-hover-line"></div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default Features;

