import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, MessageCircle, BarChart3, AlertCircle, Quote } from 'lucide-react';
import './UseCases.css';

const caseStudies = [
    {
        icon: <ShieldCheck className="text-primary" />,
        title: "Reputation Vector",
        metric: "88% Critical Detection",
        client: "Global Fintech Lead",
        desc: "Monitoring global sentiment thresholds to block disinformation campaigns. Detected a coordinated attack 4 hours before viral takeoff, preserving $40M in brand equity."
    },
    {
        icon: <MessageCircle className="text-secondary" />,
        title: "Voice of Logistics",
        metric: "45k+ Monthly Mentions",
        client: "EuroLogics Express",
        desc: "Automated analysis of fragmented feedback from drivers and partners. Identification of specific hub failure points led to a 12% increase in partner net-sentiment."
    },
    {
        icon: <BarChart3 className="text-accent" />,
        title: "Resonance Intel",
        metric: "14% Ad Conversion Lift",
        client: "StreamMedia Corp",
        desc: "Quantifying the precise emotional DNA of creative campaign drafts. Alignment with high-valence 'surprisal' metrics drove record-high engagement across Tier-1 markets."
    },
    {
        icon: <AlertCircle className="text-primary" />,
        title: "Crisis Guard v2.0",
        metric: "< 2min Alert Latency",
        client: "SafeNet Global",
        desc: "Implementation of multi-vector sentiment alerts. Immediate identification of localized outages from social gossip allowed for restorative work before customers reported tickets."
    }
];

const UseCases = () => {
    return (
        <section id="use-cases" className="use-cases-section">
            <div className="container">
                <div className="section-header">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="section-title">
                            Strategic <span className="gradient-text">Case Intel</span>
                        </h2>
                        <p className="section-desc">
                            Delivering quantifiable emotional intelligence across global infrastructure and public discourse.
                        </p>
                    </motion.div>
                </div>

                <div className="cases-grid">
                    {caseStudies.map((study, index) => (
                        <motion.div
                            key={index}
                            className="case-card feature-card"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: index * 0.15 }}
                        >
                            <div className="case-header">
                                <div className="case-badge">{study.client}</div>
                                <div className="case-metric-highlight">{study.metric}</div>
                            </div>
                            
                            <div className="case-icon-row">
                                <div className="study-icon-box">{study.icon}</div>
                                <h3 className="case-title">{study.title}</h3>
                            </div>
                            
                            <p className="case-desc">{study.desc}</p>
                            
                            <div className="case-footer">
                                <span className="case-link">Full Technical Audit</span>
                                <ArrowRight size={16} className="case-arrow" />
                            </div>
                        </motion.div>
                    ))}
                </div>
                
                {/* 9. Expert Testimonial or Global Impact Row */}
                <motion.div 
                    className="impact-cta-row glass"
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                >
                    <div className="impact-quote-box">
                        <Quote size={48} className="quote-icon" />
                        <p className="impact-quote">
                            "SentimentIQ isn't just a dashboard. It's a strategic weapon that turns digital noise into structured executive clarity."
                        </p>
                        <div className="quote-author">
                            <span className="author-name">David V. Chen</span>
                            <span className="author-title">Chief of Data Strategy @ NexaStream</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default UseCases;

