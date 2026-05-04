// src/pages/Unauthorized.tsx
// Page shown to users without proper access

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <div style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '2rem',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h1 style={{
          color: '#dc3545',
          marginBottom: '1rem',
          fontSize: '2rem'
        }}>
          Access Denied
        </h1>
        <p style={{
          color: '#6c757d',
          marginBottom: '2rem',
          lineHeight: '1.5'
        }}>
          You don't have permission to access this application.
          Only administrators are allowed to use this platform.
        </p>
        <button
          onClick={handleLogout}
          style={{
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Unauthorized;