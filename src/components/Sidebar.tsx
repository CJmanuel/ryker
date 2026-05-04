// src/components/Sidebar.tsx
// Simple sidebar for dashboard navigation

import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Allow both admin and department_user roles
  if (!profile || !['admin', 'department_user'].includes(profile.role)) {
    return null;
  }

  return (
    <nav className="sidebar">
      <ul>
        <li>
          <NavLink to="/dashboard" end>
            Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink to="/campaigns">Campaigns</NavLink>
        </li>
        <li>
          <NavLink to="/clients">Clients</NavLink>
        </li>
        <li>
          <NavLink to="/budgets">Budgets</NavLink>
        </li>
        <li>
          <NavLink to="/team">Team</NavLink>
        </li>
        <li>
          <NavLink to="/media">Media Library</NavLink>
        </li>
        <li>
          <NavLink to="/files">Files</NavLink>
        </li>
        <li>
          <NavLink to="/upload">Upload</NavLink>
        </li>
        <li>
          <NavLink to="/profile">Profile</NavLink>
        </li>
        <li>
          <NavLink to="/admin/logs">Activity Logs</NavLink>
        </li>
        <li>
          <NavLink to="/admin/members">Manage Members</NavLink>
        </li>
        <li>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Sidebar;
