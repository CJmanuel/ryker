// src/pages/Login.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { showError } from '../services/toastService';
import { logAuthEvent } from '../services/activityLogger';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        await logAuthEvent('login', data.user.id, email);
        navigate('/dashboard');
      }
    } catch (err: any) {
      const errMsg = err.message || 'Login failed';
      await logAuthEvent('login_failed', 'unknown', email, 'unknown', undefined, errMsg);
      showError(errMsg);
    }
  };

  return (
    <div className="login-container">
      <div>
        <h2>Login Phil Media Backup</h2>
        <p>Access your secure data backup</p>
        <form onSubmit={handleSubmit}>
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
        <button type="submit">Login</button>
      </form>
      <div className="auth-footer">
        Don't have an account? <Link to="/register">Register here</Link>
      </div>
      </div>
    </div>
  );
};

export default Login;
