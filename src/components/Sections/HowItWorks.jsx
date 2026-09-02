import React from 'react';
import { motion } from 'framer-motion';
import { Database, Filter, Activity, BarChart, ChevronRight } from 'lucide-react';
import './HowItWorks.css';

const steps = [
    {
        icon: <Database size={28} />,
        title: "Dynamic Ingestion",
        desc: "Connect to live aggregate feeds from X, Facebook, and Instagram seamlessly through our streaming API."
    },
    {
        icon: <Filter size={28} />,
        title: "AI Purification",
        desc: "GPT-4o filters noise and normalizes structure, ensuring only high-signal data proceeds to analysis."
    },
    {
        icon: <Activity size={28} />,
        title: "Neural Analysis",
        desc: "VADER and transformer models run in parallel to detect sentiment, core emotions, and product aspects."
    },
    {
        icon: <BarChart size={28} />,
        title: "Strategic Dash",
        desc: "Real-time updates to your dashboard with interactive Recharts for immediate executive reporting."
    }
];

const HowItWorks = () => {
    return (
        <section id="how-it-works" className="how-it-works-section">
            <div className="container">
                <div className="section-header">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="section-title">
                            The <span className="gradient-text">Streamline</span> Process
                        </h2>
                        <p className="section-desc">
                            From global social chatter to precision business intelligence in four automated layers.
                        </p>
                    </motion.div>
                </div>

                <div className="process-flow">
                    {steps.map((step, index) => (
                        <React.Fragment key={index}>
                            <motion.div
                                className="process-step"
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.15 }}
                            >
                                <div className="step-badge">0{index + 1}</div>
                                <div className="step-icon-container">
                                    {step.icon}
                                </div>
                                <h3 className="step-title">{step.title}</h3>
                                <p className="step-desc">{step.desc}</p>
                            </motion.div>
                            {index < steps.length - 1 && (
                                <div className="step-arrow">
                                    <ChevronRight size={24} className="text-muted" />
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;

