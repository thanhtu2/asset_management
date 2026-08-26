import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredPermission, requiredPermissions }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const hasRequiredPermission = requiredPermission
    ? user?.permissions?.includes(requiredPermission)
    : requiredPermissions?.some(permission => user?.permissions?.includes(permission));

  if ((requiredPermission || requiredPermissions) && !hasRequiredPermission) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
