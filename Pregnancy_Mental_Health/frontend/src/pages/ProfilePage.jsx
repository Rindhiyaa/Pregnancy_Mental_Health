import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../styles/DashboardPage.css";
import "../styles/ProfilePage.css";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [profileData, setProfileData] = useState({
    fullName: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "",
    department: "",
    memberSince: ""
  });

  const [editData, setEditData] = useState({});

  //handle logout
  const handleTopLogout = async () => {
    try {
      const token = localStorage.getItem('ppd_access_token');
      if (user?.email && token) {
        await fetch(
          `http://127.0.0.1:8000/api/logout-status`,
          {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
          }
        );
      }
    } catch (e) {
      console.error("Failed to update logout status", e);
    }
  
    logout();
    navigate("/");
  };

  // Load profile data from auth context
  useEffect(() => {
    if (user) {
      setProfileData(user);
      setEditData(user); 
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update auth context and localStorage
      updateUser(editData);
      setProfileData(editData);
      setIsEditing(false);
      
      // Show success message
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData(profileData);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    const token = localStorage.getItem('ppd_access_token');
    if (!user?.email || !token) {
      alert("Could not determine your email. Please log in again.");
      return;
    }
  
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/me`,
        { 
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );
  
      if (!res.ok) {
        const msg = await res.text();
        console.error("Delete failed:", res.status, msg);
        alert("Error deleting account. Please try again.");
        return;
      }
  
      logout();      // clear frontend
      alert("Account deleted successfully!");
      navigate("/");
    } catch (err) {
      console.error("Network error while deleting account:", err);
      alert("Network error while deleting account. Please try again.");
    }
  };  


  return (
    <div className="dp-root profile-root">
      {/* clinician navbar (same as dashboard) */}
      <header className="dp-navbar">
        <div className="dp-nav-left">
          <div className="dp-logo-mark">PR</div>
          <div className="dp-logo-text">
            <span>PPD Predictor</span>
            <span>Clinician dashboard</span>
          </div>
        </div>

        <nav className="dp-nav-center">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              "dp-nav-link" + (isActive ? " dp-nav-link-active" : "")
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/dashboard/new-assessment"
            className={({ isActive }) =>
              "dp-nav-link" + (isActive ? " dp-nav-link-active" : "")
            }
          >
            New Assessment
          </NavLink>
          <NavLink
            to="/dashboard/History"
            className={({ isActive }) =>
              "dp-nav-link" + (isActive ? " dp-nav-link-active" : "")
            }
          >
            History
          </NavLink>
          <NavLink
            to="/dashboard/Profile"
            className={({ isActive }) =>
              "dp-nav-link" + (isActive ? " dp-nav-link-active" : "")
            }
          >
            Profile
          </NavLink>
        </nav>

        <div className="dp-nav-right">
          <div className="dp-profile-chip">
            <div className="dp-profile-avatar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <span className="dp-profile-name">{profileData.fullName}</span>
          </div>
          <button className="dp-logout-btn" onClick={handleTopLogout}>
            Logout
          </button>

        </div>
      </header>

      <main className="profile-shell">
        {/* Left Sidebar */}
        <div className="profile-sidebar">
          {/* Enhanced Profile Summary Card */}
          <div className="profile-summary-card">
            <div className="profile-cover">
              <div className="cover-gradient"></div>
            </div>
            <div className="profile-avatar-section">
              <div className="profile-avatar-large">
                {profileData.fullName.charAt(0).toUpperCase()}
                <div className="profile-status-badge"></div>
              </div>
            </div>
            <div className="profile-info-content">
              <h2 className="profile-name">{profileData.fullName}</h2>
              <p className="profile-role">{profileData.role || 'Healthcare Professional'}</p>
              <div className="profile-member-since">
                <svg className="calendar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Member since {profileData.memberSince}
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="profile-quick-actions">
              <div className="quick-action-item">
                <div className="action-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="action-content">
                  <span className="action-label">Account Status</span>
                  <span className="action-value active">Active</span>
                </div>
              </div>
              
              <div className="quick-action-item">
                <div className="action-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="action-content">
                  <span className="action-label">Security</span>
                  <span className="action-value secure">Verified</span>
                </div>
              </div>
              
              <div className="quick-action-item">
                <div className="action-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="action-content">
                  <span className="action-label">Last Login</span>
                  <span className="action-value">Today</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="profile-main">
          {/* Enhanced Header with Cover Style */}
          <div className="profile-header">
            <div className="header-cover">
              <div className="header-gradient"></div>
            </div>
            <div className="header-content-wrapper">
              <div className="header-content">
                <div className="header-icon-large">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="header-text">
                  <h1>Profile Settings</h1>
                  <p className="header-subtitle">Manage your account information and preferences</p>
                </div>
              </div>
              <div className="profile-actions">
                {!isEditing ? (
                  <>
                    <button className="btn-edit" onClick={() => setIsEditing(true)}>
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Profile
                    </button>
                    <button className="btn-delete" onClick={() => setShowDeleteModal(true)}>
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Account
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn-save" onClick={handleSave} disabled={saving}>
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button className="btn-cancel" onClick={handleCancel}>
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Profile Cards with Interactive Elements */}
          <div className="profile-cards">
            {/* Personal Information Card */}
            <div className="profile-card">
              <div className="card-header">
                <div className="card-header-main">
                  <div className="card-icon-wrapper">
                    <svg className="card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="card-header-text">
                    <h3>Personal Information</h3>
                    <p className="card-description">Your basic personal details and contact information</p>
                  </div>
                </div>
              </div>
              <div className="card-content">
                <div className="form-section">
                  <div className="form-group">
                    <label className="form-label">
                      <span className="label-icon">👤</span>
                      First Name
                    </label>
                    {isEditing ? (
                      <input
                        className="form-input"
                        type="text"
                        name="firstName"
                        value={editData.firstName}
                        onChange={handleChange}
                        placeholder="Enter your first name"
                      />
                    ) : (
                      <div className="field-display">
                        <span className="field-value">{profileData.firstName || 'Not provided'}</span>
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      <span className="label-icon">👤</span>
                      Last Name
                    </label>
                    {isEditing ? (
                      <input
                        className="form-input"
                        type="text"
                        name="lastName"
                        value={editData.lastName}
                        onChange={handleChange}
                        placeholder="Enter your last name"
                      />
                    ) : (
                      <div className="field-display">
                        <span className="field-value">{profileData.lastName || 'Not provided'}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-section">
                  <div className="form-group">
                    <label className="form-label">
                      <span className="label-icon">📱</span>
                      Phone Number
                    </label>
                    {isEditing ? (
                      <input
                        className="form-input"
                        type="tel"
                        name="phone"
                        value={editData.phone}
                        onChange={handleChange}
                        placeholder="Enter your phone number"
                      />
                    ) : (
                      <div className="field-display">
                        <span className="field-value">{profileData.phone || 'Not provided'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Information Card */}
            <div className="profile-card">
              <div className="card-header">
                <div className="card-header-main">
                  <div className="card-icon-wrapper professional">
                    <svg className="card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6z" />
                    </svg>
                  </div>
                  <div className="card-header-text">
                    <h3>Professional Information</h3>
                    <p className="card-description">Your work-related details and credentials</p>
                  </div>
                </div>
              </div>
              <div className="card-content">
                <div className="form-section">
                  <div className="form-group">
                    <label className="form-label">
                      <span className="label-icon">📧</span>
                      Email Address
                    </label>
                    {isEditing ? (
                      <input
                        className="form-input"
                        type="email"
                        name="email"
                        value={editData.email}
                        onChange={handleChange}
                        placeholder="Enter your email address"
                      />
                    ) : (
                      <div className="field-display verified-field">
                        <span className="field-value">{profileData.email}</span>
                        <div className="verified-badge">
                          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                          Verified
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      <span className="label-icon">🏥</span>
                      Role/Specialization
                    </label>
                    {isEditing ? (
                      <input
                        className="form-input"
                        type="text"
                        name="role"
                        value={editData.role}
                        onChange={handleChange}
                        placeholder="Enter your role or specialization"
                      />
                    ) : (
                      <div className="field-display">
                        <span className="field-value">{profileData.role || 'Not provided'}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-section">
                  <div className="form-group full-width">
                    <label className="form-label">
                      <span className="label-icon">🏢</span>
                      Department
                    </label>
                    {isEditing ? (
                      <input
                        className="form-input"
                        type="text"
                        name="department"
                        value={editData.department}
                        onChange={handleChange}
                        placeholder="Enter your department"
                      />
                    ) : (
                      <div className="field-display">
                        <span className="field-value">{profileData.department || 'Not provided'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-header-content">
                  <div className="modal-warning-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="modal-header-text">
                    <h2>Delete Account</h2>
                    <p className="modal-header-subtitle">This action cannot be undone</p>
                  </div>
                </div>
                <button className="modal-close-btn" onClick={() => setShowDeleteModal(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete your account? This action cannot be undone and will remove all your data including assessment history.</p>
              </div>
              <div className="modal-footer">
                <button className="modal-btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button className="btn-delete-confirm" onClick={handleDelete}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProfilePage;