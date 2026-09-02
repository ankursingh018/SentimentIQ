import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, BarChart2 } from 'lucide-react';
import './Auth.css';
import '../components/Sections/Hero.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                setSubmitted(true);
            } else {
                setError(data.message || 'Request failed');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="hero-bg">
                <div className="hero-blob blob-2" style={{ top: '10%', left: '10%' }}></div>
                <div className="hero-blob blob-3" style={{ bottom: '10%', right: '10%' }}></div>
            </div>

            <motion.div
                className="auth-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="auth-header">
                    <Link to="/" className="flex items-center justify-center gap-2 mb-6 group" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 transition-shadow" style={{ padding: '0.5rem', borderRadius: '8px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
                            <BarChart2 className="text-white w-6 h-6" size={24} color="white" />
                        </div>
                        <span className="text-xl font-bold" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'black' }}>
                            Sentient<span style={{ color: 'var(--primary)' }}>AI</span>
                        </span>
                    </Link>
                    <h2 className="auth-title">Reset Password</h2>
                    <p className="auth-subtitle">
                        {!submitted
                            ? "Enter your email and we'll send you a recovery link"
                            : "Check your inbox for further instructions"}
                    </p>
                    {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
                </div>

                {!submitted ? (
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="form-input"
                                    placeholder="name@company.com"
                                    required
                                    style={{ width: '100%', paddingLeft: '40px' }}
                                />
                            </div>
                        </div>

                        <button type="submit" className="auth-btn" disabled={loading}>
                            {loading ? 'Sending...' : 'Send Recovery Link'}
                        </button>
                    </form>
                ) : (
                    <div style={{ textAlign: 'center', margin: '2rem 0' }}>
                        <div style={{
                            background: 'rgba(99, 102, 241, 0.1)',
                            color: 'var(--primary)',
                            padding: '1rem',
                            borderRadius: '12px',
                            border: '1px solid var(--primary)'
                        }}>
                            Email sent successfully! (Check console for mock token)
                        </div>
                    </div>
                )}

                <div className="auth-footer" style={{ marginTop: '2rem' }}>
                    <Link to="/login" className="auth-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ArrowLeft size={16} /> Back to Sign In
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
