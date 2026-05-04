// src/pages/Profile.tsx
// User profile page showing role, department, and account info

import { useAuth } from '../context/AuthContext';

const Profile: React.FC = () => {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <h2>Loading Profile</h2>
          <p>Fetching your account information...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="dashboard-wrapper">
        <div style={{ padding: '2rem' }}>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-6xl mb-4">👤</div>
            <h2 className="text-red-800 font-bold text-xl mb-2">Profile Not Found</h2>
            <p className="text-red-700">Unable to load your profile information.</p>
          </div>
        </div>
      </div>
    );
  }

  const roleColor = profile.role === 'admin' ? 'var(--primary)' : 'var(--secondary)';
  const deptColor = 'var(--tertiary)';

  return (
    <div className="dashboard-wrapper">
      {/* Hero Section */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1>User Profile</h1>
            <p>Manage your account settings and view your permissions</p>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-icon">👤</div>
              <div className="hero-stat-content">
                <div className="hero-stat-value">{profile.username}</div>
                <div className="hero-stat-label">Username</div>
              </div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-icon">🏢</div>
              <div className="hero-stat-content">
                <div className="hero-stat-value">{profile.department}</div>
                <div className="hero-stat-label">Department</div>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-chart">
            <div className="chart-placeholder">
              <div className="chart-bar" style={{ height: '70%' }}></div>
              <div className="chart-bar active" style={{ height: '85%' }}></div>
              <div className="chart-bar" style={{ height: '60%' }}></div>
              <div className="chart-bar" style={{ height: '75%' }}></div>
              <div className="chart-bar" style={{ height: '50%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="content-grid">
        {/* Profile Information */}
        <div className="activity-card">
          <div className="card-header">
            <h3>Account Information</h3>
            <div className="card-actions">
              <button className="btn-ghost">Edit</button>
            </div>
          </div>
          <div style={{ padding: '2rem' }}>
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <div className="metric-card" style={{ margin: 0, padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '2rem' }}>👤</div>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: '600' }}>
                      Username
                    </h4>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {profile.username}
                    </p>
                  </div>
                </div>
              </div>

              <div className="metric-card" style={{ margin: 0, padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '2rem' }}>📧</div>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: '600' }}>
                      Email Address
                    </h4>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {profile.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="metric-card" style={{ margin: 0, padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '2rem' }}>🏢</div>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: '600' }}>
                      Department
                    </h4>
                    <div style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      backgroundColor: `${deptColor}20`,
                      color: deptColor,
                      marginTop: '0.25rem'
                    }}>
                      {profile.department}
                    </div>
                  </div>
                </div>
              </div>

              <div className="metric-card" style={{ margin: 0, padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '2rem' }}>
                    {profile.role === 'admin' ? '👑' : '👤'}
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: '600' }}>
                      Role
                    </h4>
                    <div style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      backgroundColor: `${roleColor}20`,
                      color: roleColor,
                      marginTop: '0.25rem'
                    }}>
                      {profile.role === 'admin' ? 'Administrator' : 'Department User'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="metric-card" style={{ margin: 0, padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '2rem' }}>🆔</div>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: '600' }}>
                      User ID
                    </h4>
                    <p style={{
                      margin: 0,
                      color: 'var(--text-secondary)',
                      fontSize: '0.9rem',
                      fontFamily: 'monospace',
                      background: 'rgba(30, 41, 59, 0.6)',
                      padding: '0.5rem',
                      borderRadius: '8px',
                      wordBreak: 'break-all'
                    }}>
                      {profile.id}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Permissions */}
        <div className="analytics-card">
          <div className="card-header">
            <h3>Permissions & Access</h3>
          </div>
          <div style={{ padding: '2rem' }}>
            {profile.role === 'admin' ? (
              <div>
                <div style={{
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                  color: 'white',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  marginBottom: '2rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👑</div>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: '700' }}>
                    Administrator Access
                  </h4>
                  <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem' }}>
                    Full system access and management capabilities
                  </p>
                </div>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {[
                    '✓ View and manage all departments',
                    '✓ Access activity logs and analytics',
                    '✓ Create/update documents across all departments',
                    '✓ Delete files and manage storage',
                    '✓ Manage user access controls',
                    '✓ Configure system settings',
                    '✓ View comprehensive reports'
                  ].map((permission, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '0.75rem 1rem',
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      borderRadius: '8px',
                      color: 'var(--success)',
                      fontSize: '0.9rem',
                      fontWeight: '500'
                    }}>
                      <span style={{ fontSize: '1.1rem' }}>✓</span>
                      <span>{permission.replace('✓ ', '')}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div style={{
                  background: 'linear-gradient(135deg, var(--secondary), var(--tertiary))',
                  color: 'white',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  marginBottom: '2rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👤</div>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: '700' }}>
                    Department User Access
                  </h4>
                  <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem' }}>
                    Department-specific access and collaboration tools
                  </p>
                </div>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {[
                    '✓ Create campaigns, clients, and budgets',
                    '✓ View and manage team members',
                    '✓ Upload and download files',
                    '✓ Access media library',
                    '✓ Collaborate with department colleagues',
                    '✓ View department-specific reports'
                  ].map((permission, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '0.75rem 1rem',
                      background: 'rgba(99, 102, 241, 0.1)',
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                      borderRadius: '8px',
                      color: 'var(--tertiary)',
                      fontSize: '0.9rem',
                      fontWeight: '500'
                    }}>
                      <span style={{ fontSize: '1.1rem' }}>✓</span>
                      <span>{permission.replace('✓ ', '')}</span>
                    </div>
                  ))}
                  {[
                    '✗ Cannot access other departments\' data',
                    '✗ Cannot access activity logs',
                    '✗ Cannot manage system settings'
                  ].map((restriction, index) => (
                    <div key={`restrict-${index}`} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '0.75rem 1rem',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: '8px',
                      color: 'var(--error)',
                      fontSize: '0.9rem',
                      fontWeight: '500'
                    }}>
                      <span style={{ fontSize: '1.1rem' }}>✗</span>
                      <span>{restriction.replace('✗ ', '')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button className="action-btn primary">
            <div className="action-icon">⚙️</div>
            <div className="action-content">
              <div className="action-title">Account Settings</div>
              <div className="action-desc">Update your profile information</div>
            </div>
          </button>
          <button className="action-btn secondary">
            <div className="action-icon">🔐</div>
            <div className="action-content">
              <div className="action-title">Change Password</div>
              <div className="action-desc">Update your account security</div>
            </div>
          </button>
          <button className="action-btn accent">
            <div className="action-icon">📊</div>
            <div className="action-content">
              <div className="action-title">View Activity</div>
              <div className="action-desc">Check your recent actions</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
