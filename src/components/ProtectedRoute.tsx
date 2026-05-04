// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, profile, loading } = useAuth();

  console.log('ProtectedRoute - user:', user?.id, 'profile:', profile, 'loading:', loading);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '1rem'
      }}>
        <div>Loading...</div>
        <small style={{ color: '#666' }}>If stuck here, check browser console for errors</small>
      </div>
    );
  }

  if (!user) {
    console.log('ProtectedRoute - no user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Allow both admin and department_user roles
  if (!profile?.role || !['admin', 'department_user'].includes(profile.role)) {
    console.log('ProtectedRoute - invalid role:', profile?.role, 'redirecting to unauthorized');
    return <Navigate to="/unauthorized" replace />;
  }

  console.log('ProtectedRoute - access granted for role:', profile?.role);
  return <>{children}</>;
};

export default ProtectedRoute;
