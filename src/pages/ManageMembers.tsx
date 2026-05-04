// src/pages/ManageMembers.tsx
// Admin page to manage platform members

import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import type { UserProfile } from '../types';

const ManageMembers: React.FC = () => {
  const { profile, loading: authLoading } = useAuth();
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Only admin can access
  if (authLoading) {
    return (
      <div style={{ padding: '20px' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!profile || profile.role !== 'admin') {
    return <Navigate to="/unauthorized" replace />;
  }

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('username');

      if (error) {
        throw error;
      }

      setMembers(data || []);
    } catch (err: any) {
      console.error('Error fetching members:', err);
      setError(`Failed to load members: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (memberId: string, memberEmail: string) => {
    if (!confirm(`Are you sure you want to delete the member with email: ${memberEmail}? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(memberId);

      // Delete from users table
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', memberId);

      if (deleteError) {
        throw deleteError;
      }

      // Delete from auth.users (this requires admin privileges in Supabase)
      // Note: This might need to be done via Supabase Admin API or RPC function
      // For now, we'll just remove from the users table
      // const { error: authError } = await supabase.auth.admin.deleteUser(memberId);

      // Refresh the list
      await fetchMembers();

      alert('Member deleted successfully');
    } catch (err: any) {
      console.error('Error deleting member:', err);
      setError(`Failed to delete member: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p>Loading members...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '4px', padding: '12px', color: '#c00' }}>
          <h3>Error Loading Members</h3>
          <p>{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchMembers();
            }}
            style={{ marginTop: '10px', padding: '5px 10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Manage Members</h1>

      {members.length === 0 ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#666' }}>
          <p>No members found.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Username</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Email</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Department</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Role</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} style={{ border: '1px solid #ddd' }}>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>{member.username}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>{member.email}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>{member.department}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      backgroundColor: member.role === 'admin' ? '#d4edda' : '#f8f9fa',
                      color: member.role === 'admin' ? '#155724' : '#383d41'
                    }}>
                      {member.role}
                    </span>
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                    <button
                      onClick={() => handleDeleteMember(member.id, member.email)}
                      disabled={deletingId === member.id || member.role === 'admin'}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: member.role === 'admin' ? '#6c757d' : '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: member.role === 'admin' ? 'not-allowed' : (deletingId === member.id ? 'not-allowed' : 'pointer'),
                        opacity: member.role === 'admin' ? 0.5 : 1
                      }}
                    >
                      {deletingId === member.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <h3 style={{ marginBottom: '10px', color: '#495057' }}>Notes:</h3>
        <ul style={{ color: '#6c757d', margin: 0, paddingLeft: '20px' }}>
          <li>Admin users cannot be deleted from this interface</li>
          <li>Deleting a member removes them from the database but may not remove their auth account</li>
          <li>Use caution when deleting members as this action cannot be undone</li>
        </ul>
      </div>
    </div>
  );
};

export default ManageMembers;