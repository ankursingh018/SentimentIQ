import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import dashboardImg from '../../assets/dashboard.png';
import './DashboardPreview.css';

const DashboardPreview = () => {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    const rotateX = useTransform(scrollYProgress, [0, 0.5], [15, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.5], [0.8, 1]);
    const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

    return (
        <section id="dashboard" className="dashboard-section" ref={ref}>
            <div className="container">
                <div className="section-header">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="section-title">
                            Live <span className="gradient-text">Command Center</span>
                        </h2>
                        <p className="section-desc">
                            A professional-grade interface designed for rapid analysis and decision-making.
                        </p>
                    </motion.div>
                </div>

                <motion.div
                    className="dashboard-preview-wrapper"
                    style={{
                        perspective: "1000px",
                        rotateX,
                        scale,
                        opacity
                    }}
                >
                    <div className="dashboard-window glass">
                        <div className="window-header">
                            <div className="window-controls">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                            <div className="window-url">https://sentiment-iq.ai/dashboard</div>
                        </div>
                        <div className="window-body">
                            <img src={dashboardImg} alt="Dashboard Preview" className="dashboard-image" />
                            <div className="dashboard-glow"></div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default DashboardPreview;

