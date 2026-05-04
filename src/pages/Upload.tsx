// src/pages/Upload.tsx
// Advanced file upload with drag and drop

import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFileUpload } from '../hooks/useFileUpload';
import { showSuccess, showError } from '../services/toastService';
import { logFileOperation } from '../services/activityLogger';

const Upload: React.FC = () => {
  const { user, profile } = useAuth();
  const { uploadFile } = useFileUpload();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (file: File): string => {
    const type = file.type;
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎬';
    if (type === 'application/pdf') return '📄';
    if (type.includes('sheet')) return '📊';
    if (type.includes('document')) return '📝';
    if (type.includes('zip') || type.includes('rar')) return '📦';
    return '📎';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setUploadProgress(0);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      setUploadProgress(0);
    }
  };

  const handleUpload = async () => {
    if (!file || !profile || !user) {
      showError('Please select a file first');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    console.log('Upload - starting upload for file:', file.name);

    // Simulate progress (0-90%), will be set to 100 on completion
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        const newProgress = prev + Math.random() * 30;
        return Math.min(newProgress, 90); // Cap at 90% during upload
      });
    }, 300);

    try {
      const uploadPromise = uploadFile(file, profile.department, user.id);
      
      // Dynamic timeout based on file size - longer for large files
      const fileSizeMB = file.size / (1024 * 1024);
      const timeoutDuration = fileSizeMB > 100 ? 600000 : fileSizeMB > 50 ? 300000 : 180000; // 10min, 5min, or 3min
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Upload is taking too long (${Math.round(timeoutDuration / 60000)} minutes). Please try again or contact support for very large files.`)), timeoutDuration)
      );

      const result = await Promise.race([uploadPromise, timeoutPromise as any]) as any;

      clearInterval(progressInterval);
      
      if (result.success) {
        console.log('Upload - upload completed successfully');
        setUploadProgress(100); // Set to exactly 100 on completion
        showSuccess('File uploaded successfully! 🎉 Go to Files tab to view.');
        await logFileOperation('upload', user.id, profile.department, file.name, file.size, file.type, profile.username);
        setTimeout(() => {
          setFile(null);
          setUploadProgress(0);
        }, 2000);
      } else {
        console.log('Upload - upload failed:', result.error);
        setUploadProgress(0);
        // Check if it's a "already exists" error - this might still be a success
        if (result.error?.includes('already exists')) {
          showSuccess('File already exists - it may be displayed in the Files tab. Try refreshing the Files page.');
        } else {
          showError(result.error || 'Upload failed');
        }
      }
    } catch (err: any) {
      console.error('Upload - unexpected error:', err);
      clearInterval(progressInterval);
      setUploadProgress(0);
      showError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="dashboard-wrapper">
      {/* Hero Section */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Upload Backup</h1>
            <p>Securely upload your files to the backup system with advanced encryption</p>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-icon">🔒</div>
              <div className="hero-stat-content">
                <div className="hero-stat-value">100%</div>
                <div className="hero-stat-label">Secure</div>
              </div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-icon">⚡</div>
              <div className="hero-stat-content">
                <div className="hero-stat-value">Fast</div>
                <div className="hero-stat-label">Upload</div>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-chart">
            <div className="chart-placeholder">
              <div className="chart-bar" style={{ height: '65%' }}></div>
              <div className="chart-bar active" style={{ height: '90%' }}></div>
              <div className="chart-bar" style={{ height: '75%' }}></div>
              <div className="chart-bar" style={{ height: '80%' }}></div>
              <div className="chart-bar" style={{ height: '70%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="content-grid">
        <div className="activity-card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <h3>File Upload</h3>
          </div>
          <div style={{ padding: '2rem' }}>
            {!file ? (
              <div
                className={`upload-dropzone ${isDragActive ? 'active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragActive ? 'var(--primary)' : 'rgba(148, 163, 184, 0.3)'}`,
                  borderRadius: '16px',
                  padding: '3rem 2rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: isDragActive ? 'rgba(99, 102, 241, 0.05)' : 'rgba(30, 41, 59, 0.3)',
                  transition: 'all 0.3s ease',
                  marginBottom: '2rem'
                }}
              >
                <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.7 }}>📤</div>
                <h3 style={{
                  margin: '0 0 0.5rem 0',
                  color: 'var(--text-primary)',
                  fontSize: '1.4rem',
                  fontWeight: '600'
                }}>
                  Drag and drop your file here
                </h3>
                <p style={{
                  margin: '0 0 1rem 0',
                  color: 'var(--text-secondary)',
                  fontSize: '1rem'
                }}>
                  or click to select from your computer
                </p>
                <p style={{
                  margin: 0,
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  opacity: 0.8
                }}>
                  Supports large files with automatic chunking
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  style={{ display: 'none' }}
                />
              </div>
            ) : (
              <div className="metric-card" style={{ margin: 0, padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                  <div style={{ fontSize: '3rem' }}>{getFileIcon(file)}</div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{
                      margin: '0 0 0.5rem 0',
                      color: 'var(--text-primary)',
                      fontSize: '1.2rem',
                      fontWeight: '600'
                    }}>
                      {file.name}
                    </h4>
                    <p style={{
                      margin: 0,
                      color: 'var(--text-secondary)',
                      fontSize: '0.9rem'
                    }}>
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>

                {isUploading && (
                  <div style={{ marginBottom: '2rem' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Uploading...
                      </span>
                      <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: '600' }}>
                        {Math.round(uploadProgress)}%
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: 'rgba(30, 41, 59, 0.6)',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${uploadProgress}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
                        borderRadius: '4px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button
                    className="btn-upload"
                    onClick={handleUpload}
                    disabled={isUploading}
                    style={{
                      flex: 1,
                      padding: '0.9rem 1.5rem',
                      background: isUploading
                        ? 'rgba(156, 163, 175, 0.6)'
                        : 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      cursor: isUploading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: isUploading ? 'none' : '0 4px 15px rgba(99, 102, 241, 0.3)',
                      minWidth: '120px'
                    }}
                  >
                    {isUploading ? `Uploading... ${Math.round(uploadProgress)}%` : '🚀 Upload File'}
                  </button>
                  <button
                    className="btn-clear"
                    onClick={clearFile}
                    disabled={isUploading}
                    style={{
                      padding: '0.9rem 1.5rem',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: '10px',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      cursor: isUploading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: isUploading ? 0.6 : 1
                    }}
                  >
                    ✕ Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="quick-actions">
        <h3>Security Features</h3>
        <div className="actions-grid">
          <div className="action-btn" style={{ cursor: 'default', background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            <div className="action-icon">🔒</div>
            <div className="action-content">
              <div className="action-title">End-to-End Encryption</div>
              <div className="action-desc">Your files are encrypted before upload</div>
            </div>
          </div>
          <div className="action-btn" style={{ cursor: 'default', background: 'rgba(99, 102, 241, 0.1)', borderColor: 'rgba(99, 102, 241, 0.3)' }}>
            <div className="action-icon">⚡</div>
            <div className="action-content">
              <div className="action-title">Fast & Reliable</div>
              <div className="action-desc">Optimized upload speeds and reliability</div>
            </div>
          </div>
          <div className="action-btn" style={{ cursor: 'default', background: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.3)' }}>
            <div className="action-icon">📋</div>
            <div className="action-content">
              <div className="action-title">Automatic Logging</div>
              <div className="action-desc">All uploads are tracked and logged</div>
            </div>
          </div>
          <div className="action-btn" style={{ cursor: 'default', background: 'rgba(236, 72, 153, 0.1)', borderColor: 'rgba(236, 72, 153, 0.3)' }}>
            <div className="action-icon">🛡️</div>
            <div className="action-content">
              <div className="action-title">Virus Scanning</div>
              <div className="action-desc">Files are scanned for security threats</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
