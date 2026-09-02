import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    BarChart2, Bell, Settings, Filter, Download,
    TrendingUp, Users, MessageSquare, AlertTriangle,
    ChevronDown, FileText, User, LogOut
} from 'lucide-react';
import {
    PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import './Dashboard.css';

// API base URL; backend serves sentiment dashboard at /api/sentiment/dashboard
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const DASHBOARD_POLL_MS = 30 * 1000; // 30 seconds - live updates without reload

// Map KPI icon names from API to Lucide components (API sends string to keep payload serializable)
const KPI_ICON_MAP = {
    MessageSquare,
    TrendingUp,
    AlertTriangle,
    BarChart2,
    Users,
    Bell,
};

// Default data shown until first API response (matches original mock shape)
const defaultDashboard = {
    kpiData: [
        { title: 'Total Posts', value: '—', change: 'Live', color: 'text-green', icon: MessageSquare },
        { title: 'Positive Sentiment', value: '—', change: 'Live', color: 'text-green', icon: TrendingUp },
        { title: 'Negative Sentiment', value: '—', change: 'Live', color: 'text-green', icon: AlertTriangle },
        { title: 'Avg. Sentiment', value: '—', change: 'Live', color: 'text-green', icon: BarChart2 },
        { title: 'Dominant Emotion', value: '—', change: 'Stable', color: 'text-blue', icon: Users },
        { title: 'Active Alerts', value: '0', change: 'Live', color: 'text-red', icon: Bell },
    ],
    sentimentPieData: [{ name: 'Neutral', value: 1, color: '#94a3b8' }],
    trendData: [],
    recentPosts: [],
    emotionData: [
        { subject: 'Joy', A: 120, fullMark: 150 },
        { subject: 'Anger', A: 30, fullMark: 150 },
        { subject: 'Sadness', A: 40, fullMark: 150 },
        { subject: 'Fear', A: 20, fullMark: 150 },
        { subject: 'Surprise', A: 60, fullMark: 150 },
    ],
    aspectData: [
        { name: 'Price', sentiment: 45 },
        { name: 'Quality', sentiment: 85 },
        { name: 'Service', sentiment: 60 },
        { name: 'Features', sentiment: 75 },
        { name: 'Performance', sentiment: 80 },
    ],
    keywords: [
        { text: 'AI', value: 60 },
        { text: 'Tech', value: 50 },
        { text: 'Innovation', value: 45 },
        { text: 'Future', value: 40 },
        { text: 'Data', value: 35 },
    ],
};

const Dashboard = () => {
    const [platform, setPlatform] = useState('All');
    const [contentFilter, setContentFilter] = useState('all'); // 'all', 'posts', 'comments'
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [dashboardData, setDashboardData] = useState(defaultDashboard);
    const navigate = useNavigate();

    // Fetch sentiment dashboard from backend; poll every 30s for live data
    // Added [platform] dependency so it re-fetches immediately when a user clicks a button
    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                // Pass current platform filter and content filter to backend
                let url = `${API_BASE}/api/sentiment/dashboard?`;
                if (platform !== 'All') url += `platform=${platform}&`;
                if (contentFilter !== 'all') url += `filter=${contentFilter}&`;

                const res = await fetch(url);
                if (!res.ok) return;
                const data = await res.json();
                const kpiWithIcons = (data.kpiData || []).map((k) => ({
                    ...k,
                    icon: KPI_ICON_MAP[k.icon] || BarChart2,
                }));
                setDashboardData({
                    ...data,
                    kpiData: kpiWithIcons.length ? kpiWithIcons : defaultDashboard.kpiData,
                    sentimentPieData: data.sentimentPieData || defaultDashboard.sentimentPieData,
                    trendData: data.trendData || defaultDashboard.trendData,
                    recentPosts: data.recentPosts || defaultDashboard.recentPosts,
                    emotionData: data.emotionData || defaultDashboard.emotionData,
                    aspectData: data.aspectData || defaultDashboard.aspectData,
                    keywords: data.keywords || defaultDashboard.keywords,
                });
            } catch (err) {
                console.warn('Dashboard fetch failed:', err);
            }
        };
        fetchDashboard();
        const interval = setInterval(fetchDashboard, DASHBOARD_POLL_MS);
        return () => clearInterval(interval);
    }, [platform, contentFilter]);

    const { kpiData, sentimentPieData, trendData, emotionData, aspectData, keywords, recentPosts } = dashboardData;

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        navigate('/login');
    };

    const handleExport = async (format) => {
        setShowExportMenu(false);
        const timestamp = new Date().toISOString().slice(0, 10);

        try {
            if (format === 'PDF') {
                const element = document.querySelector('.dashboard-content');
                if (!element) return;

                const canvas = await html2canvas(element, {
                    scale: 2,
                    backgroundColor: '#0b0e14',
                    logging: false,
                    useCORS: true
                });

                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`SentimentIQ-Dashboard-${timestamp}.pdf`);
            } else if (format === 'Excel') {
                const ws = XLSX.utils.json_to_sheet(recentPosts);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Recent Mentions");
                XLSX.writeFile(wb, `SentimentIQ-Mentions-${timestamp}.xlsx`);
            } else if (format === 'PowerPoint') {
                alert('PowerPoint export is currently simulated via PDF. Please use the PDF export for presentation slides.');
            }
        } catch (err) {
            console.error('Export failed:', err);
            alert('Export failed. Please try again.');
        }
    };

    return (
        <div className={`dashboard-container theme-${platform.toLowerCase()}`}>
            {/* 1. Top Navigation */}
            <nav className="dashboard-nav">
                <div className="dash-logo">
                    <BarChart2 color="var(--theme-primary)" />
                    <span>SentimentIQ</span>
                </div>

                <div className="platform-selector">
                    {['All', 'Bluesky', 'Mastodon', 'Lemmy'].map(p => (
                        <button
                            key={p}
                            className={`platform-btn ${platform === p ? 'active' : ''}`}
                            onClick={() => setPlatform(p)}
                        >
                            {p}
                        </button>
                    ))}
                </div>





                <div className="nav-actions">
                    <button className="icon-btn-wrapper">
                        <Bell size={20} color="#94a3b8" />
                        <span className="notification-dot"></span>
                    </button>

                    <div className="user-profile-wrapper">
                        <div className="user-profile" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                            <div className="user-avatar">
                                {(localStorage.getItem('userName') || 'AD').split(' ').map(n => n[0]).join('').toUpperCase()}
                            </div>
                            <ChevronDown size={16} color="#94a3b8" />
                        </div>

                        {showProfileMenu && (
                            <div className="profile-dropdown">
                                <button className="dropdown-item" onClick={() => navigate('/profile')}>
                                    <User size={18} />
                                    My Profile
                                </button>
                                <button className="dropdown-item logout" onClick={handleLogout}>
                                    <LogOut size={18} />
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Date Range Filter Section */}
            <div className="date-filter-section">
                <div className="date-filter-container">
                    <div className="export-wrapper">
                        <button className="export-btn" onClick={() => setShowExportMenu(!showExportMenu)}>
                            <Download size={18} />
                            Export
                            <ChevronDown size={16} />
                        </button>

                        {showExportMenu && (
                            <div className="export-dropdown">
                                <button className="export-dropdown-item" onClick={() => handleExport('PDF')}>
                                    <FileText size={18} />
                                    Export as PDF
                                </button>
                                <button className="export-dropdown-item" onClick={() => handleExport('Excel')}>
                                    <FileText size={18} />
                                    Export as Excel
                                </button>
                                <button className="export-dropdown-item" onClick={() => handleExport('PowerPoint')}>
                                    <FileText size={18} />
                                    Export as PowerPoint
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="dashboard-content">

                {/* 2. KPI Cards */}
                {kpiData.map((kpi, idx) => (
                    <motion.div
                        key={idx}
                        className="kpi-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                    >
                        <div className="flex justify-between items-start">
                            <div className="kpi-title">{kpi.title}</div>
                            <kpi.icon size={18} className="text-slate-400" />
                        </div>
                        <div className="kpi-value">{kpi.value}</div>
                        <div className={`kpi-change ${kpi.color}`}>
                            {kpi.change} <span className="text-slate-400 text-xs ml-1">vs last week</span>
                        </div>
                    </motion.div>
                ))}



                {/* 3. Sentiment Distribution */}
                <div className="chart-card sentiment-dist">
                    <div className="chart-header">
                        <h3 className="chart-title">Global Sentiment</h3>
                        <Filter size={18} color="#94a3b8" style={{ cursor: 'pointer' }} />
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={sentimentPieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {sentimentPieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f1f5f9' }} itemStyle={{ color: '#f1f5f9' }} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* 4. Trend Over Time */}
                <div className="chart-card trend-chart">
                    <div className="chart-header">
                        <h3 className="chart-title">Sentiment Trends (24h)</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                            <XAxis dataKey="time" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f1f5f9' }} itemStyle={{ color: '#f1f5f9' }} />
                            <Legend />
                            <Line type="monotone" dataKey="positive" stroke="#10b981" strokeWidth={3} dot={false} />
                            <Line type="monotone" dataKey="neutral" stroke="#94a3b8" strokeWidth={3} dot={false} />
                            <Line type="monotone" dataKey="negative" stroke="#ef4444" strokeWidth={3} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* 5. Emotion Analysis */}
                <div className="chart-card emotion-chart">
                    <div className="chart-header">
                        <h3 className="chart-title">Emotion Radar</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={emotionData}>
                            <PolarGrid stroke="#334155" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8' }} />
                            <PolarRadiusAxis />
                            <Radar name="Emotions" dataKey="A" stroke="var(--theme-primary)" fill="var(--theme-primary)" fillOpacity={0.6} />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f1f5f9' }} itemStyle={{ color: '#f1f5f9' }} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                {/* 6. Aspect Analysis */}
                <div className="chart-card aspect-chart">
                    <div className="chart-header">
                        <h3 className="chart-title">Aspect Sentiment</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={aspectData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                            <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" />
                            <YAxis dataKey="name" type="category" width={100} stroke="#94a3b8" />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f1f5f9' }} itemStyle={{ color: '#f1f5f9' }} />
                            <Bar dataKey="sentiment" fill="var(--theme-primary)" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* 7. Word Cloud (Simplified as list for now as 'react-tagcloud' wasn't installed, or use simple mapping) */}
                <div className="chart-card word-cloud">
                    <div className="chart-header">
                        <h3 className="chart-title">Trending Keywords</h3>
                    </div>
                    <div className="flex flex-wrap gap-2 p-4 justify-center items-center h-full">
                        {keywords.map((k, i) => (
                            <span key={i} style={{ fontSize: `${k.value / 2}px`, opacity: k.value / 60 + 0.3 }} className="word-cloud-item">
                                {k.text}
                            </span>
                        ))}
                        <span className="text-slate-400 text-sm">(Word cloud visualization)</span>
                    </div>
                </div>

                {/* 8. Post Level Table */}
                <div className="chart-card post-table">
                    <div className="chart-header">
                        <h3 className="chart-title">Recent Mentions</h3>
                        <button className="export-btn" onClick={() => handleExport('Excel')}>
                            <Download size={16} /> Export CSV
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="table-head">
                                    <th className="p-3 font-medium">Platform</th>
                                    <th className="p-3 font-medium">Content</th>
                                    <th className="p-3 font-medium">Sentiment</th>
                                    <th className="p-3 font-medium">Score</th>
                                    <th className="p-3 font-medium">Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentPosts.map(post => (
                                    <tr key={post.id} className="post-row">
                                        <td className="p-3">
                                            <span className={`badge-platform ${post.platform === 'Twitter' ? 'badge-twitter' : post.platform === 'Facebook' ? 'badge-facebook' : post.platform === 'Mastodon' ? 'badge-mastodon' : post.platform === 'Reddit' ? 'badge-reddit' : post.platform === 'Bluesky' ? 'badge-bluesky' : post.platform === 'Lemmy' ? 'badge-lemmy' : 'badge-instagram'}`}>
                                                {post.platform}
                                            </span>
                                        </td>
                                        <td className="p-3 text-sm truncate max-w-xs">{post.content}</td>
                                        <td className="p-3">
                                            <span className={`sentiment-badge ${post.sentiment === 'Positive' ? 'badge-positive' : post.sentiment === 'Negative' ? 'badge-negative' : 'badge-neutral'}`}>
                                                {post.sentiment}
                                            </span>
                                        </td>
                                        <td className="p-3 text-sm font-medium">{post.score}</td>
                                        <td className="p-3 text-xs text-slate-400">{post.time}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
