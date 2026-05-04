// src/pages/Files.tsx
// Advanced file browser with filtering and actions

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { showSuccess, showError } from '../services/toastService';

interface FileMeta {
  id?: string;
  filename: string;
  department: string;
  uploadedBy: string;
  uploadDate: any;
  fileSize: number;
  downloadURL: string;
}

const Files: React.FC = () => {
  const { profile } = useAuth();
  const [files, setFiles] = useState<FileMeta[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileMeta[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'size' | 'name'>('date');
  const [loading, setLoading] = useState(true);

  const getFileIcon = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const iconMap: Record<string, string> = {
      pdf: '📄', doc: '📝', docx: '📝', txt: '📃',
      xls: '📊', xlsx: '📊', csv: '📊',
      jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️',
      mp4: '🎬', avi: '🎬', mov: '🎬', mkv: '🎬',
      zip: '📦', rar: '📦',
      exe: '⚙️', msi: '⚙️', dmg: '⚙️',
    };
    if (ext === '7z') return '📦';
    return iconMap[ext] || '📎';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  useEffect(() => {
    const fetchFiles = async () => {
      if (!profile) {
        console.log('Files - no profile yet');
        return;
      }
      try {
        setLoading(true);
        console.log('Files - fetching files for department:', profile.department, 'role:', profile.role);

        const { data, error } = profile.role === 'admin'
          ? await supabase
              .from('backups')
              .select('*')
              .order('created_at', { ascending: false })
          : await supabase
              .from('backups')
              .select('*')
              .eq('department', profile.department)
              .order('created_at', { ascending: false });

        if (error) {
          console.error('Files - fetch error:', error);
          throw error;
        }

        console.log('Files - fetched', data?.length || 0, 'files');

        const filesData = (data || []).map(backup => ({
          id: backup.id,
          filename: backup.filename,
          department: backup.department,
          uploadedBy: backup.uploadedby,
          uploadDate: new Date(backup.created_at),
          fileSize: backup.filesize,
          downloadURL: backup.downloadurl
        })) as FileMeta[];

        setFiles(filesData);
        setFilteredFiles(filesData);
      } catch (err) {
        console.error('Files error', err);
        showError('Failed to load files');
      } finally {
        setLoading(false);
      }
    };
    fetchFiles();
  }, [profile]);

  // Search and filter
  useEffect(() => {
    let result = files.filter(f => f.filename.toLowerCase().includes(searchTerm.toLowerCase()));

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'size') return b.fileSize - a.fileSize;
      if (sortBy === 'name') return a.filename.localeCompare(b.filename);
      return b.uploadDate.getTime() - a.uploadDate.getTime();
    });

    setFilteredFiles(result);
  }, [files, searchTerm, sortBy]);

  const handleDelete = async (file: FileMeta) => {
    if (!confirm(`Delete ${file.filename}?`)) return;

    try {
      console.log('Files - deleting file:', file.id);
      // Delete from storage - assuming the path is stored in the backup record
      // For now, we'll need to construct the path or store it
      // const { error: storageError } = await supabase.storage
      //   .from('backups')
      //   .remove([file.path]);

      // Delete from database
      const { error: dbError } = await supabase
        .from('backups')
        .delete()
        .eq('id', file.id);

      if (dbError) {
        console.error('Files - delete error:', dbError);
        throw dbError;
      }

      console.log('Files - file deleted successfully');
      showSuccess('File deleted successfully');
      setFiles(files.filter(f => f.id !== file.id));
    } catch (err) {
      console.error('Files - delete error', err);
      showError('Failed to delete file');
    }
  };

  const totalSize = files.reduce((sum, f) => sum + f.fileSize, 0);

  const refreshFiles = async () => {
    if (!profile) return;
    try {
      console.log('Files - refreshing files...');
      setLoading(true);

      const { data, error } = profile.role === 'admin'
        ? await supabase
            .from('backups')
            .select('*')
            .order('created_at', { ascending: false })
        : await supabase
            .from('backups')
            .select('*')
            .eq('department', profile.department)
            .order('created_at', { ascending: false });

      if (error) {
        console.error('Files - refresh error:', error);
        showError('Failed to refresh files');
        return;
      }

      const filesData = (data || []).map(backup => ({
        id: backup.id,
        filename: backup.filename,
        department: backup.department,
        uploadedBy: backup.uploadedby,
        uploadDate: new Date(backup.created_at),
        fileSize: backup.filesize,
        downloadURL: backup.downloadurl
      })) as FileMeta[];

      setFiles(filesData);
      setFilteredFiles(filesData);
      console.log('Files - refreshed, found', filesData.length, 'files');
      showSuccess('Files refreshed!');
    } catch (err) {
      console.error('Files - refresh error', err);
      showError('Failed to refresh files');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <h2>Loading Files</h2>
          <p>Fetching your backup files...</p>
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
            <h1>Backup Files</h1>
            <p>Manage and download your secure backup files</p>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-icon">📁</div>
              <div className="hero-stat-content">
                <div className="hero-stat-value">{files.length}</div>
                <div className="hero-stat-label">Total Files</div>
              </div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-icon">💾</div>
              <div className="hero-stat-content">
                <div className="hero-stat-value">{formatFileSize(totalSize)}</div>
                <div className="hero-stat-label">Total Size</div>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-chart">
            <div className="chart-placeholder">
              <div className="chart-bar" style={{ height: '60%' }}></div>
              <div className="chart-bar active" style={{ height: '80%' }}></div>
              <div className="chart-bar" style={{ height: '45%' }}></div>
              <div className="chart-bar" style={{ height: '70%' }}></div>
              <div className="chart-bar" style={{ height: '55%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="content-grid">
        {/* Files List */}
        <div className="activity-card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <h3>Your Files</h3>
            <div className="card-actions">
              <button className="btn-ghost" onClick={refreshFiles} disabled={loading}>
                {loading ? '⏳ Refreshing...' : '🔄 Refresh'}
              </button>
            </div>
          </div>

          {/* Controls */}
          <div style={{ padding: '0 2rem 1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '12px',
                  background: 'rgba(30, 41, 59, 0.6)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                padding: '0.75rem 1rem',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '12px',
                background: 'rgba(30, 41, 59, 0.6)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem'
              }}
            >
              <option value="date">Newest First</option>
              <option value="size">Largest First</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>

          <div style={{ padding: '0 2rem 2rem' }}>
            {filteredFiles.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h4>No Files Found</h4>
                <p>
                  {files.length === 0
                    ? 'No backup files yet. Start by uploading a file from the Upload tab.'
                    : 'No files match your search criteria.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                {filteredFiles.map((file, idx) => (
                  <div key={idx} className="metric-card" style={{ margin: 0, cursor: 'default' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{ fontSize: '2rem' }}>{getFileIcon(file.filename)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{
                          margin: 0,
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {file.filename}
                        </h4>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                          {formatFileSize(file.fileSize)} • {formatDate(file.uploadDate)}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <a
                        href={file.downloadURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          flex: 1,
                          padding: '0.5rem 1rem',
                          background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                          color: 'white',
                          textDecoration: 'none',
                          borderRadius: '8px',
                          fontSize: '0.85rem',
                          fontWeight: '500',
                          textAlign: 'center',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        ⬇️ Download
                      </a>
                      {profile?.role === 'admin' && (
                        <button
                          style={{
                            padding: '0.5rem 1rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                          onClick={() => handleDelete(file)}
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Files;
