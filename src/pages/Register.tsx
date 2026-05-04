// src/pages/Register.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { showError, showSuccess } from '../services/toastService';
import { logAuthEvent } from '../services/activityLogger';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [department, setDepartment] = useState('IT');
  const [role, setRole] = useState<'admin' | 'department_user'>('department_user');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Clear any existing session to avoid remaining logged-in user (e.g., admin)
      await supabase.auth.signOut();

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            department,
            role,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        await logAuthEvent('register', data.user.id, username, department);
        showSuccess('Account created successfully! Please check your email to confirm your account.');
        // After registration, go to login so the new account session can be properly established
        navigate('/login');
      }
    } catch (err: any) {
      showError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="register-container">
      <div>
        <h2>Phil Media Register</h2>
        <p>Create your account to get started</p>
        <form onSubmit={handleSubmit}>
        <div>
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Department</label>
          <select value={department} onChange={(e) => setDepartment(e.target.value)}>
            <option value="IT">IT</option>
            <option value="HR">HR</option>
            <option value="Finance">Finance</option>
          </select>
        </div>
        <div>
          <label>Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'department_user')}>
            <option value="department_user">Department User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button type="submit">Register</button>
      </form>
      <div className="auth-footer">
        Already have an account? <Link to="/login">Login here</Link>
      </div>
      </div>
    </div>
  );
};

export default Register;
