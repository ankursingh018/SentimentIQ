import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Calendar, LogOut, ArrowLeft, Lock, Phone, Briefcase, MapPin, FileText, Edit2, Save, X } from 'lucide-react';
import './Profile.css';

const Profile = () => {
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    // Get user data from localStorage
    const userEmail = localStorage.getItem('userEmail') || 'user@example.com';
    const userName = localStorage.getItem('userName') || 'User';

    // Editable profile data
    const [profileData, setProfileData] = useState({
        phone: localStorage.getItem('userPhone') || '',
        company: localStorage.getItem('userCompany') || '',
        location: localStorage.getItem('userLocation') || '',
        bio: localStorage.getItem('userBio') || '',
        joinDate: new Date(localStorage.getItem('joinDate') || Date.now()).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
        })
    });

    const [editedData, setEditedData] = useState({ ...profileData });

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        navigate('/login');
    };

    const handleEdit = () => {
        setIsEditing(true);
        setEditedData({ ...profileData });
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditedData({ ...profileData });
    };

    const handleSave = () => {
        // Save to localStorage
        localStorage.setItem('userPhone', editedData.phone);
        localStorage.setItem('userCompany', editedData.company);
        localStorage.setItem('userLocation', editedData.location);
        localStorage.setItem('userBio', editedData.bio);

        setProfileData({ ...editedData });
        setIsEditing(false);
    };

    const handleInputChange = (field, value) => {
        setEditedData({ ...editedData, [field]: value });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError('New passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            return;
        }

        setPasswordSuccess('Password changed successfully!');
        setTimeout(() => {
            setShowPasswordModal(false);
            setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
            setPasswordSuccess('');
        }, 2000);
    };

    return (
        <div className="profile-container">
            <div className="profile-header">
                <button className="back-btn" onClick={() => navigate('/dashboard')}>
                    <ArrowLeft size={20} />
                    Back to Dashboard
                </button>

                {!isEditing ? (
                    <button className="edit-profile-btn" onClick={handleEdit}>
                        <Edit2 size={18} />
                        Edit Profile
                    </button>
                ) : (
                    <div className="edit-actions">
                        <button className="cancel-edit-btn" onClick={handleCancel}>
                            <X size={18} />
                            Cancel
                        </button>
                        <button className="save-edit-btn" onClick={handleSave}>
                            <Save size={18} />
                            Save Changes
                        </button>
                    </div>
                )}
            </div>

            <div className="profile-content">
                <div className="profile-card">
                    <div className="profile-avatar-large">
                        {userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>

                    <h1 className="profile-name">{userName}</h1>
                    <p className="profile-email">{userEmail}</p>

                    <div className="profile-form">
                        {/* Personal Information Section */}
                        <div className="form-section">
                            <h3 className="section-title">Personal Information</h3>

                            <div className="profile-detail-item">
                                <div className="detail-icon">
                                    <User size={20} />
                                </div>
                                <div className="detail-content">
                                    <span className="detail-label">Full Name</span>
                                    <span className="detail-value">{userName}</span>
                                </div>
                            </div>

                            <div className="profile-detail-item">
                                <div className="detail-icon">
                                    <Mail size={20} />
                                </div>
                                <div className="detail-content">
                                    <span className="detail-label">Email Address</span>
                                    <span className="detail-value">{userEmail}</span>
                                </div>
                            </div>

                            <div className={`profile-detail-item ${isEditing ? 'editable' : ''}`}>
                                <div className="detail-icon">
                                    <Phone size={20} />
                                </div>
                                <div className="detail-content">
                                    <span className="detail-label">Phone Number</span>
                                    {isEditing ? (
                                        <input
                                            type="tel"
                                            value={editedData.phone}
                                            onChange={(e) => handleInputChange('phone', e.target.value)}
                                            className="edit-input"
                                            placeholder="Enter phone number"
                                        />
                                    ) : (
                                        <span className="detail-value">{profileData.phone || 'Not provided'}</span>
                                    )}
                                </div>
                            </div>

                            <div className={`profile-detail-item ${isEditing ? 'editable' : ''}`}>
                                <div className="detail-icon">
                                    <MapPin size={20} />
                                </div>
                                <div className="detail-content">
                                    <span className="detail-label">Location</span>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editedData.location}
                                            onChange={(e) => handleInputChange('location', e.target.value)}
                                            className="edit-input"
                                            placeholder="Enter location"
                                        />
                                    ) : (
                                        <span className="detail-value">{profileData.location || 'Not provided'}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Professional Information Section */}
                        <div className="form-section">
                            <h3 className="section-title">Professional Information</h3>

                            <div className={`profile-detail-item ${isEditing ? 'editable' : ''}`}>
                                <div className="detail-icon">
                                    <Briefcase size={20} />
                                </div>
                                <div className="detail-content">
                                    <span className="detail-label">Company</span>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editedData.company}
                                            onChange={(e) => handleInputChange('company', e.target.value)}
                                            className="edit-input"
                                            placeholder="Enter company name"
                                        />
                                    ) : (
                                        <span className="detail-value">{profileData.company || 'Not provided'}</span>
                                    )}
                                </div>
                            </div>

                            <div className={`profile-detail-item full-width ${isEditing ? 'editable' : ''}`}>
                                <div className="detail-icon">
                                    <FileText size={20} />
                                </div>
                                <div className="detail-content">
                                    <span className="detail-label">Bio</span>
                                    {isEditing ? (
                                        <textarea
                                            value={editedData.bio}
                                            onChange={(e) => handleInputChange('bio', e.target.value)}
                                            className="edit-textarea"
                                            placeholder="Tell us about yourself"
                                            rows="3"
                                        />
                                    ) : (
                                        <span className="detail-value">{profileData.bio || 'Not provided'}</span>
                                    )}
                                </div>
                            </div>

                            <div className="profile-detail-item">
                                <div className="detail-icon">
                                    <Calendar size={20} />
                                </div>
                                <div className="detail-content">
                                    <span className="detail-label">Member Since</span>
                                    <span className="detail-value">{profileData.joinDate}</span>
                                </div>
                            </div>
                        </div>

                        {/* Security Section */}
                        <div className="form-section">
                            <h3 className="section-title">Security</h3>

                            <button className="change-password-btn" onClick={() => setShowPasswordModal(true)}>
                                <Lock size={20} />
                                Change Password
                            </button>
                        </div>
                    </div>

                    <button className="logout-btn" onClick={handleLogout}>
                        <LogOut size={20} />
                        Logout
                    </button>
                </div>
            </div>

            {/* Password Change Modal */}
            {showPasswordModal && (
                <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">Change Password</h2>

                        {passwordError && <div className="error-message">{passwordError}</div>}
                        {passwordSuccess && <div className="success-message">{passwordSuccess}</div>}

                        <form onSubmit={handlePasswordSubmit} className="password-form">
                            <div className="form-group">
                                <label className="form-label">Old Password</label>
                                <input
                                    type="password"
                                    name="oldPassword"
                                    value={passwordData.oldPassword}
                                    onChange={handlePasswordChange}
                                    className="form-input"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">New Password</label>
                                <input
                                    type="password"
                                    name="newPassword"
                                    value={passwordData.newPassword}
                                    onChange={handlePasswordChange}
                                    className="form-input"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Confirm New Password</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={passwordData.confirmPassword}
                                    onChange={handlePasswordChange}
                                    className="form-input"
                                    required
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={() => setShowPasswordModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="submit-btn">
                                    Change Password
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
