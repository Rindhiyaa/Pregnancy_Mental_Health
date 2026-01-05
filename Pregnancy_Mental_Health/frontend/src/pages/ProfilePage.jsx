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
      if (user?.email) {
        await fetch(
          `http://127.0.0.1:8000/api/logout-status?email=${encodeURIComponent(
            user.email
          )}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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
    if (!user?.email) {
      alert("Could not determine your email. Please log in again.");
      return;
    }
  
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/me?email=${encodeURIComponent(user.email)}`,
        { method: "DELETE" }
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
        {/* Profile Header */}
        <section className="profile-header">
          <div className="profile-header-content">
            <div className="profile-info">
              <div className="profile-avatar-large">
                {profileData.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="profile-details">
                <h1>{profileData.fullName}</h1>
                <p>{profileData.role || 'Healthcare Professional'}</p>
                <span className="member-since">Member since {profileData.memberSince}</span>
              </div>
            </div>
            <div className="profile-actions">
              {!isEditing ? (
                <>
                  <button className="btn-edit" onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </button>
                  <button className="btn-delete" onClick={() => setShowDeleteModal(true)}>
                    Delete Account
                  </button>
                </>
              ) : (
                <>
                  <button className="btn-save" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button className="btn-cancel" onClick={handleCancel}>
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Profile Cards */}
        <section className="profile-cards">
          {/* Personal Information Card */}
          <div className="profile-card">
            <div className="card-header">
              <h3>Personal Information</h3>
            </div>
            <div className="card-content">
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="firstName"
                      value={editData.firstName}
                      onChange={handleChange}
                      placeholder="Enter first name"
                    />
                  ) : (
                    <span className="field-value">{profileData.firstName || 'Not provided'}</span>
                  )}
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="lastName"
                      value={editData.lastName}
                      onChange={handleChange}
                      placeholder="Enter last name"
                    />
                  ) : (
                    <span className="field-value">{profileData.lastName || 'Not provided'}</span>
                  )}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="fullName"
                      value={editData.fullName}
                      onChange={handleChange}
                      placeholder="Enter full name"
                    />
                  ) : (
                    <span className="field-value">{profileData.fullName}</span>
                  )}
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={editData.phone}
                      onChange={handleChange}
                      placeholder="Enter phone number"
                    />
                  ) : (
                    <span className="field-value">{profileData.phone || 'Not provided'}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Professional Information Card */}
          <div className="profile-card">
            <div className="card-header">
              <h3>Professional Information</h3>
            </div>
            <div className="card-content">
              <div className="form-row">
                <div className="form-group">
                  <label>Email Address</label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={editData.email}
                      onChange={handleChange}
                      placeholder="Enter email address"
                    />
                  ) : (
                    <span className="field-value">{profileData.email}</span>
                  )}
                </div>
                <div className="form-group">
                  <label>Role/Specialization</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="role"
                      value={editData.role}
                      onChange={handleChange}
                      placeholder="Enter role or specialization"
                    />
                  ) : (
                    <span className="field-value">{profileData.role || 'Not provided'}</span>
                  )}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Department</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="department"
                      value={editData.department}
                      onChange={handleChange}
                      placeholder="Enter department"
                    />
                  ) : (
                    <span className="field-value">{profileData.department || 'Not provided'}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Delete Account</h2>
                <button className="modal-close-btn" onClick={() => setShowDeleteModal(false)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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