import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, BarChart2 } from 'lucide-react';
import './Auth.css';
import '../components/Sections/Hero.css';

const Signup = () => {
    const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:5000/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                // Save token optionally
                localStorage.setItem('token', data.token);
                window.dispatchEvent(new Event('storage'));
                navigate('/'); // or login
            } else {
                setError(data.message || 'Signup failed');
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
                <div className="hero-blob blob-3" style={{ top: '-10%', left: '-10%' }}></div>
                <div className="hero-blob blob-1" style={{ top: 'auto', bottom: '-10%', right: '-10%' }}></div>
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
                    <h2 className="auth-title">Create Account</h2>
                    <p className="auth-subtitle">Start analyzing sentiment in minutes</p>
                    {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="John Doe"
                                required
                                style={{ width: '100%', paddingLeft: '40px' }}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="name@company.com"
                                required
                                style={{ width: '100%', paddingLeft: '40px' }}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="Create a strong password"
                                required
                                style={{ width: '100%', paddingLeft: '40px' }}
                            />
                        </div>
                    </div>

                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Account'}
                    </button>
                </form>

                <div className="or-divider">Or register with</div>

                <div className="social-login">
                    <button className="social-btn">
                        <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: '20px', height: '20px' }} />
                        Continue with Google
                    </button>
                </div>

                <div className="auth-footer">
                    Already have an account?
                    <Link to="/login" className="auth-link">Sign in</Link>
                </div>
            </motion.div>
        </div>
    );
};

export default Signup;

