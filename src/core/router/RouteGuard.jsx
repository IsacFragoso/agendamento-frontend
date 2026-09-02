import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../store/use-auth';
import { ROUTE_PATHS, getDashboardPathForAccountType } from './paths';

export function RouteGuard({ allowedRoles }) {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to={ROUTE_PATHS.login} replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(user?.tipo_conta)) {
    return <Navigate to={getDashboardPathForAccountType(user?.tipo_conta)} replace />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={getDashboardPathForAccountType(user?.tipo_conta)} replace />;
  }

  return <Outlet />;
}
