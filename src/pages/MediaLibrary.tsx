import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import type { MediaAsset } from '../types';
import { toast } from 'react-toastify';

const MediaLibrary: React.FC = () => {
  const { user, profile } = useAuth();
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [uploadData, setUploadData] = useState({
    file: null as File | null,
    name: '',
    tags: '',
    clientId: '',
    campaignId: '',
    projectId: '',
    type: 'image' as MediaAsset['type'],
    license: '',
    expirationDate: ''
  });

  const fetchAssets = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const isAdmin = profile?.role === 'admin';
      const bucketPath = isAdmin ? 'media' : `media/${user.id}`;

      const { data: storageFiles, error: storageError } = await supabase.storage
        .from('media-assets')
        .list(bucketPath, {
          limit: 1000,
          offset: 0
        });

      if (storageError) throw storageError;

      // Get metadata for each file from database to enhance display (optional, if exists)
      const { data: dbAssets, error: dbError } = isAdmin
        ? await supabase
            .from('media_assets')
            .select('*')
            .order('created_at', { ascending: false })
        : await supabase
            .from('media_assets')
            .select('*')
            .eq('uploadedBy', user.id)
            .order('created_at', { ascending: false });

      if (dbError && dbError.code !== 'PGRST116') throw dbError;

      const dbAssetsMap = new Map((dbAssets || []).map((asset: any) => [`${asset.path}`, asset]));

      const assetsData = (storageFiles || [])
        .filter(file => !file.name.startsWith('.'))
        .map(file => {
          const filePath = isAdmin ? `media/${file.name}` : `media/${user.id}/${file.name}`;
          const dbAsset = dbAssetsMap.get(filePath);

          const { data: urlData } = supabase.storage
            .from('media-assets')
            .getPublicUrl(filePath);

          const publicUrl = urlData.publicUrl;

          const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
          let type: MediaAsset['type'] = 'document';
          if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(fileExt)) type = 'image';
          else if (['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv'].includes(fileExt)) type = 'video';
          else if (['mp3', 'wav', 'aac', 'flac', 'm4a', 'ogg'].includes(fileExt)) type = 'audio';
          else if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(fileExt)) type = 'document';

          return {
            id: dbAsset?.id || file.id || `${Date.now()}-${file.name}`,
            filename: file.name,
            name: dbAsset?.name || file.name,
            type: dbAsset?.type || type,
            department: dbAsset?.department || (profile?.department || 'unknown'),
            uploadedBy: dbAsset?.uploadedBy || user.id,
            createdAt: dbAsset ? new Date(dbAsset.created_at) : new Date(file.created_at || Date.now()),
            updatedAt: dbAsset ? new Date(dbAsset.updated_at) : new Date(file.updated_at || Date.now()),
            fileSize: (file.metadata?.size as number) || 0,
            downloadURL: publicUrl || '',
            path: filePath,
            tags: (dbAsset?.tags as string[]) || [],
            clientId: dbAsset?.clientId || null,
            campaignId: dbAsset?.campaignId || null,
            projectId: dbAsset?.projectId || null,
            license: dbAsset?.license || '',
            expirationDate: dbAsset?.expirationDate ? new Date(dbAsset.expirationDate) : undefined
          } as MediaAsset;
        });

      setAssets(assetsData);
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching assets:', error);
      setError(`Failed to load assets: ${error.message}`);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [user, profile]);

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === 'all' || asset.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !uploadData.file) return;

    try {
      const fileName = `${Date.now()}_${uploadData.file.name}`;
      const filePath = `media/${user.id}/${fileName}`;

      // Upload file to Supabase storage - support large files
      const fileSizeMB = uploadData.file.size / (1024 * 1024);
      const useResumableUpload = fileSizeMB > 50; // Use resumable for files > 50MB

      let uploadResult;
      if (useResumableUpload) {
        console.log('MediaLibrary - using resumable upload for large file');
        uploadResult = await supabase.storage
          .from('media-assets')
          .upload(filePath, uploadData.file, {
            upsert: false,
            duplex: 'half',
          });
      } else {
        uploadResult = await supabase.storage
          .from('media-assets')
          .upload(filePath, uploadData.file, {
            upsert: false,
          });
      }

      if (uploadResult.error) throw uploadResult.error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media-assets')
        .getPublicUrl(filePath);

      const assetData = {
        filename: uploadData.file.name,
        name: uploadData.name || uploadData.file.name,
        type: uploadData.type,
        department: profile.department,
        uploadedBy: user.id,
        fileSize: uploadData.file.size,
        downloadURL: publicUrl,
        path: filePath,
        tags: uploadData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        clientId: uploadData.clientId || null,
        campaignId: uploadData.campaignId || null,
        projectId: uploadData.projectId || null,
        license: uploadData.license,
        expirationDate: uploadData.expirationDate ? new Date(uploadData.expirationDate).toISOString() : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('media_assets')
        .insert(assetData);

      if (insertError) throw insertError;
      toast.success('Asset uploaded successfully!');
      setShowUploadForm(false);
      resetUploadForm();
      await fetchAssets();
    } catch (error) {
      console.error('Error uploading asset:', error);
      toast.error('Failed to upload asset');
    }
  };

  const resetUploadForm = () => {
    setUploadData({
      file: null,
      name: '',
      tags: '',
      clientId: '',
      campaignId: '',
      projectId: '',
      type: 'image',
      license: '',
      expirationDate: ''
    });
  };

  const handleDelete = async (assetId: string, path: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('media-assets')
        .remove([path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('media_assets')
        .delete()
        .eq('id', assetId);

      if (dbError) throw dbError;

      toast.success('Asset deleted successfully!');
      await fetchAssets();
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast.error('Failed to delete asset');
    }
  };

  const getFileIcon = (type: MediaAsset['type']): string => {
    switch (type) {
      case 'image': return '🖼️';
      case 'video': return '🎬';
      case 'document': return '📄';
      case 'audio': return '🎵';
      default: return '📎';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalSize = assets.reduce((sum, asset) => sum + asset.fileSize, 0);

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <h2>Loading Media Library</h2>
          <p>Fetching your media assets...</p>
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
            <h2 className="text-red-800 font-bold text-xl mb-2">Error Loading Media Library</h2>
            <p className="text-red-700">{error}</p>
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
            <h1>Media Library</h1>
            <p>Manage your digital assets and creative content</p>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-icon">🎨</div>
              <div className="hero-stat-content">
                <div className="hero-stat-value">{assets.length}</div>
                <div className="hero-stat-label">Total Assets</div>
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
              <div className="chart-bar" style={{ height: '50%' }}></div>
              <div className="chart-bar active" style={{ height: '75%' }}></div>
              <div className="chart-bar" style={{ height: '60%' }}></div>
              <div className="chart-bar" style={{ height: '85%' }}></div>
              <div className="chart-bar" style={{ height: '40%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button
            className="action-btn primary"
            onClick={() => setShowUploadForm(true)}
          >
            <div className="action-icon">📤</div>
            <div className="action-content">
              <div className="action-title">Upload Asset</div>
              <div className="action-desc">Add new media files to your library</div>
            </div>
          </button>
          <button className="action-btn secondary">
            <div className="action-icon">🏷️</div>
            <div className="action-content">
              <div className="action-title">Organize Tags</div>
              <div className="action-desc">Manage and categorize your assets</div>
            </div>
          </button>
          <button className="action-btn accent">
            <div className="action-icon">📊</div>
            <div className="action-content">
              <div className="action-title">View Analytics</div>
              <div className="action-desc">See usage statistics and insights</div>
            </div>
          </button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="content-grid">
        {/* Filters and Assets */}
        <div className="activity-card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <h3>Your Assets</h3>
            <div className="card-actions">
              <button className="btn-ghost">Filter</button>
            </div>
          </div>

          {/* Filters */}
          <div style={{ padding: '0 2rem 1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <input
                type="text"
                placeholder="Search assets..."
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
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '12px',
                background: 'rgba(30, 41, 59, 0.6)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem'
              }}
            >
              <option value="all">All Types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="document">Documents</option>
              <option value="audio">Audio</option>
            </select>
          </div>

          {/* Assets Grid */}
          <div style={{ padding: '0 2rem 2rem' }}>
            {filteredAssets.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎨</div>
                <h4>No Assets Found</h4>
                <p>
                  {assets.length === 0
                    ? 'Your media library is empty. Start by uploading your first asset!'
                    : 'No assets match your search criteria.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {filteredAssets.map(asset => (
                  <div key={asset.id} className="metric-card" style={{ margin: 0, cursor: 'pointer' }}
                       onClick={() => {
                         setSelectedAsset(asset);
                         setShowPreview(true);
                       }}>
                    <div style={{ position: 'relative', marginBottom: '1rem' }}>
                      {asset.type === 'image' ? (
                        <img
                          src={asset.downloadURL}
                          alt={asset.name}
                          style={{
                            width: '100%',
                            height: '180px',
                            objectFit: 'cover',
                            borderRadius: '12px'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '180px',
                          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '3rem'
                        }}>
                          {getFileIcon(asset.type)}
                        </div>
                      )}
                      <div style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        background: 'rgba(30, 41, 59, 0.9)',
                        color: 'var(--text-primary)',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.7rem',
                        fontWeight: '600'
                      }}>
                        {asset.type}
                      </div>
                    </div>

                    <h4 style={{
                      margin: '0 0 0.5rem 0',
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {asset.name}
                    </h4>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      {formatFileSize(asset.fileSize)} • {asset.createdAt.toLocaleDateString()}
                    </div>

                    {asset.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        {asset.tags.slice(0, 2).map(tag => (
                          <span key={tag} style={{
                            background: 'rgba(99, 102, 241, 0.1)',
                            color: 'var(--tertiary)',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: '500'
                          }}>
                            {tag}
                          </span>
                        ))}
                        {asset.tags.length > 2 && (
                          <span style={{
                            background: 'rgba(156, 163, 175, 0.1)',
                            color: 'var(--text-secondary)',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '6px',
                            fontSize: '0.7rem'
                          }}>
                            +{asset.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          background: 'rgba(99, 102, 241, 0.1)',
                          color: 'var(--tertiary)',
                          border: '1px solid rgba(99, 102, 241, 0.2)',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAsset(asset);
                          setShowPreview(true);
                        }}
                      >
                        👁️ Preview
                      </button>
                      <a
                        href={asset.downloadURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '0.5rem',
                          background: 'rgba(16, 185, 129, 0.1)',
                          color: 'var(--success)',
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          textDecoration: 'none',
                          textAlign: 'center'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        ⬇️
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadForm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            background: 'rgba(30, 41, 59, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '20px',
            padding: '2rem',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{
              fontSize: '1.8rem',
              fontWeight: '700',
              marginBottom: '2rem',
              color: 'var(--text-primary)',
              background: 'linear-gradient(135deg, var(--tertiary), var(--secondary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textAlign: 'center'
            }}>
              Upload Media Asset
            </h2>
            <form onSubmit={handleFileUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem'
                }}>
                  File
                </label>
                <input
                  type="file"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploadData({...uploadData, file});
                      if (file.type.startsWith('image/')) setUploadData(prev => ({...prev, type: 'image'}));
                      else if (file.type.startsWith('video/')) setUploadData(prev => ({...prev, type: 'video'}));
                      else if (file.type.startsWith('audio/')) setUploadData(prev => ({...prev, type: 'audio'}));
                      else setUploadData(prev => ({...prev, type: 'document'}));
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '12px',
                    background: 'rgba(30, 41, 59, 0.6)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem'
                }}>
                  Asset Name
                </label>
                <input
                  type="text"
                  value={uploadData.name}
                  onChange={(e) => setUploadData({...uploadData, name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '12px',
                    background: 'rgba(30, 41, 59, 0.6)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}
                  placeholder="Leave blank to use filename"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    Type
                  </label>
                  <select
                    value={uploadData.type}
                    onChange={(e) => setUploadData({...uploadData, type: e.target.value as MediaAsset['type']})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '12px',
                      background: 'rgba(30, 41, 59, 0.6)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem'
                    }}
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="document">Document</option>
                    <option value="audio">Audio</option>
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    License
                  </label>
                  <select
                    value={uploadData.license}
                    onChange={(e) => setUploadData({...uploadData, license: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '12px',
                      background: 'rgba(30, 41, 59, 0.6)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem'
                    }}
                  >
                    <option value="">Select license</option>
                    <option value="owned">Owned</option>
                    <option value="licensed">Licensed</option>
                    <option value="royalty-free">Royalty Free</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem'
                }}>
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={uploadData.tags}
                  onChange={(e) => setUploadData({...uploadData, tags: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '12px',
                    background: 'rgba(30, 41, 59, 0.6)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}
                  placeholder="e.g. logo, brand, marketing"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadForm(false);
                    resetUploadForm();
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'none',
                    color: 'var(--text-secondary)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Upload Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && selectedAsset && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            background: 'rgba(30, 41, 59, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '20px',
            padding: '2rem',
            width: '100%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{
                fontSize: '1.8rem',
                fontWeight: '700',
                margin: 0,
                color: 'var(--text-primary)'
              }}>
                {selectedAsset.name}
              </h2>
              <button
                onClick={() => setShowPreview(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '8px'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'none'}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                {selectedAsset.type === 'image' && (
                  <img
                    src={selectedAsset.downloadURL}
                    alt={selectedAsset.name}
                    style={{
                      width: '100%',
                      height: 'auto',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                    }}
                  />
                )}
                {selectedAsset.type === 'video' && (
                  <video
                    controls
                    style={{
                      width: '100%',
                      height: 'auto',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    <source src={selectedAsset.downloadURL} />
                  </video>
                )}
                {selectedAsset.type === 'audio' && (
                  <div style={{
                    background: 'rgba(30, 41, 59, 0.6)',
                    padding: '2rem',
                    borderRadius: '12px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎵</div>
                    <audio controls style={{ width: '100%' }}>
                      <source src={selectedAsset.downloadURL} />
                    </audio>
                  </div>
                )}
                {selectedAsset.type === 'document' && (
                  <div style={{
                    background: 'rgba(30, 41, 59, 0.6)',
                    padding: '3rem',
                    borderRadius: '12px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📄</div>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                      Document preview not available
                    </p>
                    <a
                      href={selectedAsset.downloadURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        padding: '0.75rem 1.5rem',
                        background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '8px',
                        fontWeight: '500'
                      }}
                    >
                      Download to View
                    </a>
                  </div>
                )}
              </div>

              <div>
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{
                    fontSize: '1.2rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '1rem'
                  }}>
                    Details
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Type:</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{selectedAsset.type}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Size:</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{formatFileSize(selectedAsset.fileSize)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>License:</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{selectedAsset.license || 'N/A'}</span>
                    </div>
                    {selectedAsset.expirationDate && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Expires:</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                          {selectedAsset.expirationDate.toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedAsset.tags.length > 0 && (
                  <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{
                      fontSize: '1.2rem',
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      marginBottom: '1rem'
                    }}>
                      Tags
                    </h3>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {selectedAsset.tags.map(tag => (
                        <span key={tag} style={{
                          background: 'rgba(99, 102, 241, 0.1)',
                          color: 'var(--tertiary)',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: '500'
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <a
                    href={selectedAsset.downloadURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1,
                      padding: '0.75rem 1rem',
                      background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      textAlign: 'center'
                    }}
                  >
                    Download
                  </a>
                  <button
                    onClick={() => handleDelete(selectedAsset.id, selectedAsset.path)}
                    style={{
                      padding: '0.75rem 1rem',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaLibrary;
