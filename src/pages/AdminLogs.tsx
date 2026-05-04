// src/pages/AdminLogs.tsx
// View activity logs - admin only

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { Navigate } from 'react-router-dom';

interface ActivityLog {
  id: string;
  type: string;
  userId: string;
  department: string;
  filename?: string;
  fileSize?: number;
  timestamp: string;
}

const AdminLogs: React.FC = () => {
  const { profile, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Wait for auth to load
  if (authLoading) {
    return (
      <div className="dashboard-wrapper">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <h2>Loading...</h2>
          <p>Please wait while we load your profile.</p>
        </div>
      </div>
    );
  }

  // Only admin can view logs
  if (!profile || profile.role !== 'admin') {
    return <Navigate to="/unauthorized" replace />;
  }

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data, error } = await supabase
          .from('logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(100);

        if (error) {
          throw error;
        }

        setLogs(data || []);
      } catch (err: any) {
        console.error('Failed to fetch logs:', err);
        setError(`Failed to load logs: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <h2>Loading Activity Logs</h2>
          <p>Fetching the latest activity data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-wrapper">
        <div style={{ padding: '2rem' }}>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-red-800 font-bold text-xl mb-2">Error Loading Logs</h2>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const getActivityIcon = (type: string): string => {
    switch (type) {
      case 'upload': return '📤';
      case 'login': return '🔐';
      case 'register': return '👤';
      case 'delete': return '🗑️';
      case 'download': return '📥';
      default: return '📋';
    }
  };

  const getActivityColor = (type: string): string => {
    switch (type) {
      case 'upload': return 'var(--primary)';
      case 'login': return 'var(--success)';
      case 'register': return 'var(--secondary)';
      case 'delete': return 'var(--error)';
      case 'download': return 'var(--tertiary)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div className="dashboard-wrapper">
      {/* Hero Section */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Activity Logs</h1>
            <p>Monitor system activity and user actions across all departments</p>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-icon">📊</div>
              <div className="hero-stat-content">
                <div className="hero-stat-value">{logs.length}</div>
                <div className="hero-stat-label">Total Logs</div>
              </div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-icon">👥</div>
              <div className="hero-stat-content">
                <div className="hero-stat-value">{new Set(logs.map(log => log.userId)).size}</div>
                <div className="hero-stat-label">Active Users</div>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-chart">
            <div className="chart-placeholder">
              <div className="chart-bar" style={{ height: '40%' }}></div>
              <div className="chart-bar active" style={{ height: '70%' }}></div>
              <div className="chart-bar" style={{ height: '55%' }}></div>
              <div className="chart-bar" style={{ height: '85%' }}></div>
              <div className="chart-bar" style={{ height: '60%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="content-grid">
        {/* Activity Timeline */}
        <div className="activity-card">
          <div className="card-header">
            <h3>Recent Activity</h3>
            <div className="card-actions">
              <button className="btn-ghost">Refresh</button>
            </div>
          </div>
          <div className="activity-timeline">
            {logs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h4>No Activity Yet</h4>
                <p>Activity logs will appear here as users interact with the system.</p>
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="timeline-item">
                  <div className="timeline-marker" style={{ backgroundColor: `${getActivityColor(log.type)}20` }}>
                    <div className="activity-icon" style={{ color: getActivityColor(log.type) }}>
                      {getActivityIcon(log.type)}
                    </div>
                  </div>
                  <div className="timeline-content">
                    <div className="activity-title">
                      {log.type.charAt(0).toUpperCase() + log.type.slice(1)} Activity
                    </div>
                    <div className="activity-meta">
                      <span>User: {log.userId.slice(0, 8)}...</span>
                      <span>•</span>
                      <span>{log.department}</span>
                      <span>•</span>
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="activity-details">
                      {log.filename && `File: ${log.filename}`}
                      {log.fileSize && ` (${(log.fileSize / 1024).toFixed(1)} KB)`}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Activity Summary */}
        <div className="analytics-card">
          <div className="card-header">
            <h3>Activity Summary</h3>
          </div>
          <div className="storage-visual">
            <div className="storage-stats">
              <div className="stat-item">
                <div className="stat-label">Uploads</div>
                <div className="stat-value">{logs.filter(log => log.type === 'upload').length}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Logins</div>
                <div className="stat-value">{logs.filter(log => log.type === 'login').length}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Downloads</div>
                <div className="stat-value">{logs.filter(log => log.type === 'download').length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogs;
