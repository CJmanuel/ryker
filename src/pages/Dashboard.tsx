// src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStorageQuota } from '../hooks/useStorageQuota';
import { supabase } from '../services/supabase';

const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const quotaStats = profile ? useStorageQuota(profile.department) : null;

  const [stats, setStats] = useState<{
    totalFiles: number;
    totalBytes: number;
    uploadedToday: number;
    lastUpload: Date | null;
    campaignsActive: number;
    clientsCount: number;
    teamMembers: number;
  }>({ totalFiles: 0, totalBytes: 0, uploadedToday: 0, lastUpload: null, campaignsActive: 0, clientsCount: 0, teamMembers: 0 });

  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchStats = async () => {
      if (!profile) return;
      try {
        setIsLoading(true);

        // Fetch backup files stats
        const { data: backups, error: backupsError } = profile.role === 'admin'
          ? await supabase.from('backups').select('*')
          : await supabase.from('backups').select('*').eq('department', profile.department);

        if (backupsError) throw backupsError;

        let totalFiles = backups?.length || 0;
        let totalBytes = backups?.reduce((sum, backup) => sum + (backup.fileSize || 0), 0) || 0;
        let uploadedToday = 0;
        let lastUpload: Date | null = null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        backups?.forEach((backup) => {
          const uploadDate = new Date(backup.created_at);
          if (uploadDate >= today) {
            uploadedToday += 1;
          }

          if (!lastUpload || uploadDate > lastUpload) {
            lastUpload = uploadDate;
          }
        });

        // Fetch media assets count
        const { count: mediaCount, error: mediaError } = profile.role === 'admin'
          ? await supabase.from('media_assets').select('*', { count: 'exact', head: true })
          : await supabase.from('media_assets').select('*', { count: 'exact', head: true }).eq('department', profile.department);

        if (!mediaError) {
          totalFiles += mediaCount || 0;
        }

        setStats((prev) => ({
          ...prev,
          totalFiles,
          totalBytes,
          uploadedToday,
          lastUpload,
          campaignsActive: 0, // Placeholder - campaigns table not yet implemented
          clientsCount: 0, // Placeholder - clients table not yet implemented
          teamMembers: 1 // Placeholder - users table count not implemented
        }));

        // Additional stats will be added when corresponding tables are implemented
      } catch (err) {
        console.error('stats error', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [profile]);

  // Fetch recent activities
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const { data: logs, error } = await supabase
          .from('logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(6);

        if (error) throw error;

        const activities = (logs || []).map(log => ({
          id: log.id,
          ...log,
          timestamp: new Date(log.timestamp)
        }));

        setRecentActivities(activities);
      } catch (err) {
        console.error('activities error', err);
      }
    };
    fetchActivities();
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getIcon = (action: string) => {
    const icons: Record<string, string> = {
      upload: '📤', download: '📥', login: '🔐', register: '✍️', delete: '🗑️',
    };
    return icons[action] || '📋';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return '#ef4444';
    if (percentage >= 60) return '#f59e0b';
    return '#10b981';
  };

  if (isLoading) {
    return (
      <div className="dashboard-wrapper">
        <div className="dashboard-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <h2>Loading your dashboard...</h2>
            <p>Fetching the latest data and insights</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      {/* Hero Section */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Welcome back, {profile?.username || 'User'}! 👋</h1>
            <p>Here's what's happening with your media assets today</p>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-icon">📁</div>
              <div className="hero-stat-content">
                <span className="hero-stat-value">{stats.totalFiles}</span>
                <span className="hero-stat-label">Total Assets</span>
              </div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-icon">💾</div>
              <div className="hero-stat-content">
                <span className="hero-stat-value">{formatBytes(stats.totalBytes)}</span>
                <span className="hero-stat-label">Storage Used</span>
              </div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-icon">📈</div>
              <div className="hero-stat-content">
                <span className="hero-stat-value">{stats.uploadedToday}</span>
                <span className="hero-stat-label">Uploaded Today</span>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-chart">
            <div className="chart-placeholder">
              <div className="chart-bar" style={{ height: '60%' }}></div>
              <div className="chart-bar" style={{ height: '80%' }}></div>
              <div className="chart-bar" style={{ height: '40%' }}></div>
              <div className="chart-bar" style={{ height: '90%' }}></div>
              <div className="chart-bar" style={{ height: '70%' }}></div>
              <div className="chart-bar" style={{ height: '85%' }}></div>
              <div className="chart-bar active" style={{ height: '95%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Container */}
      <div className="dashboard-container">
        {/* Key Metrics Grid */}
        <div className="metrics-grid">
          <div className="metric-card primary">
            <div className="metric-header">
              <div className="metric-icon">🎯</div>
              <div className="metric-trend positive">
                <span className="trend-icon">↗️</span>
                <span>+12%</span>
              </div>
            </div>
            <div className="metric-content">
              <h3 className="metric-value">{stats.campaignsActive}</h3>
              <p className="metric-label">Active Campaigns</p>
              <div className="metric-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '75%' }}></div>
                </div>
                <span className="progress-text">75% completion rate</span>
              </div>
            </div>
          </div>

          <div className="metric-card secondary">
            <div className="metric-header">
              <div className="metric-icon">👥</div>
              <div className="metric-trend neutral">
                <span className="trend-icon">→</span>
                <span>0%</span>
              </div>
            </div>
            <div className="metric-content">
              <h3 className="metric-value">{stats.clientsCount}</h3>
              <p className="metric-label">Active Clients</p>
              <div className="metric-chart">
                <div className="mini-chart">
                  <div className="chart-line"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="metric-card accent">
            <div className="metric-header">
              <div className="metric-icon">👨‍💼</div>
              <div className="metric-trend positive">
                <span className="trend-icon">↗️</span>
                <span>+5%</span>
              </div>
            </div>
            <div className="metric-content">
              <h3 className="metric-value">{stats.teamMembers}</h3>
              <p className="metric-label">Team Members</p>
              <div className="metric-avatars">
                <div className="avatar-stack">
                  <div className="avatar">JD</div>
                  <div className="avatar">SM</div>
                  <div className="avatar">AB</div>
                </div>
              </div>
            </div>
          </div>

          <div className="metric-card success">
            <div className="metric-header">
              <div className="metric-icon">💰</div>
              <div className="metric-trend positive">
                <span className="trend-icon">↗️</span>
                <span>+8%</span>
              </div>
            </div>
            <div className="metric-content">
              <h3 className="metric-value">ZK{(stats.totalBytes / 1024 / 1024).toFixed(1)}M</h3>
              <p className="metric-label">Budget Spent</p>
              <div className="metric-sparkline">
                <svg viewBox="0 0 100 20" className="sparkline">
                  <path d="M0,15 L20,12 L40,18 L60,8 L80,14 L100,6" stroke="#10b981" strokeWidth="2" fill="none"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="content-grid">
          {/* Storage Analytics */}
          <div className="analytics-card">
            <div className="card-header">
              <h3>Storage Analytics</h3>
              <div className="card-actions">
                <button className="btn-ghost">View Details</button>
              </div>
            </div>
            <div className="storage-visual">
              <div className="storage-chart">
                <div className="chart-center">
                  <div className="chart-ring">
                    <div
                      className="chart-progress"
                      style={{
                        background: `conic-gradient(${getProgressColor((quotaStats?.percentageUsed || 0) * 100)} ${(quotaStats?.percentageUsed || 0) * 360}deg, rgba(148, 163, 184, 0.2) 0deg)`
                      }}
                    ></div>
                    <div className="chart-inner">
                      <span className="chart-percentage">{((quotaStats?.percentageUsed || 0) * 100).toFixed(0)}%</span>
                      <span className="chart-label">Used</span>
                    </div>
                  </div>
                </div>
                <div className="storage-breakdown">
                  <div className="storage-item">
                    <div className="storage-color videos"></div>
                    <span>Videos: 45%</span>
                  </div>
                  <div className="storage-item">
                    <div className="storage-color images"></div>
                    <span>Images: 30%</span>
                  </div>
                  <div className="storage-item">
                    <div className="storage-color documents"></div>
                    <span>Docs: 15%</span>
                  </div>
                  <div className="storage-item">
                    <div className="storage-color audio"></div>
                    <span>Audio: 10%</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="storage-stats">
              <div className="stat-item">
                <span className="stat-label">Used</span>
                <span className="stat-value">{formatBytes(stats.totalBytes)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Available</span>
                <span className="stat-value">{quotaStats ? formatBytes(quotaStats.limit - stats.totalBytes) : '—'}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total</span>
                <span className="stat-value">{quotaStats ? formatBytes(quotaStats.limit) : '—'}</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="activity-card">
            <div className="card-header">
              <h3>Recent Activity</h3>
              <div className="card-actions">
                <button className="btn-ghost">View All</button>
              </div>
            </div>
            <div className="activity-timeline">
              {recentActivities.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <h4>No recent activities</h4>
                  <p>Activities will appear here as you use the platform</p>
                </div>
              ) : (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="timeline-item">
                    <div className="timeline-marker">
                      <span className="activity-icon">{getIcon(activity.action)}</span>
                    </div>
                    <div className="timeline-content">
                      <div className="activity-title">
                        {activity.action.charAt(0).toUpperCase() + activity.action.slice(1)}
                      </div>
                      <div className="activity-meta">
                        <span className="activity-time">
                          {activity.timestamp?.toDate?.()
                            ? new Date(activity.timestamp.toDate()).toLocaleString()
                            : 'N/A'}
                        </span>
                        {activity.details && (
                          <span className="activity-details">• {activity.details}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="actions-grid">
            <button className="action-btn primary">
              <div className="action-icon">📤</div>
              <div className="action-content">
                <span className="action-title">Upload Files</span>
                <span className="action-desc">Add new media assets</span>
              </div>
            </button>
            <button className="action-btn secondary">
              <div className="action-icon">🎯</div>
              <div className="action-content">
                <span className="action-title">New Campaign</span>
                <span className="action-desc">Start a marketing campaign</span>
              </div>
            </button>
            <button className="action-btn accent">
              <div className="action-icon">📊</div>
              <div className="action-content">
                <span className="action-title">View Reports</span>
                <span className="action-desc">Check analytics & insights</span>
              </div>
            </button>
            <button className="action-btn success">
              <div className="action-icon">👥</div>
              <div className="action-content">
                <span className="action-title">Manage Team</span>
                <span className="action-desc">Add or edit team members</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
