import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../store/use-auth';
import { PublicOnlyRoute, RouteGuard } from './RouteGuard';
import { ROUTE_PATHS, getDashboardPathForAccountType, getClientPath, getProviderPath } from './paths';
import LoginPage from '../../modules/auth/pages/LoginPage';
import RegisterPage from '../../modules/auth/pages/RegisterPage';
import ProviderDashboardPage from '../../modules/dashboard/pages/ProviderDashboardPage';
import ClientDashboardPage from '../../modules/dashboard/pages/ClientDashboardPage';

function RootRedirect() {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={getDashboardPathForAccountType(user?.tipo_conta)} replace />;
  }

  return <Navigate to={ROUTE_PATHS.login} replace />;
}

function AppRedirect() {
  const { user } = useAuth();
  return <Navigate to={getDashboardPathForAccountType(user?.tipo_conta)} replace />;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTE_PATHS.root} element={<RootRedirect />} />

        <Route element={<PublicOnlyRoute />}>
          <Route path={ROUTE_PATHS.login} element={<LoginPage />} />
          <Route path={ROUTE_PATHS.register} element={<RegisterPage />} />
        </Route>

        <Route element={<RouteGuard />}>
          <Route path={ROUTE_PATHS.app} element={<AppRedirect />} />

          <Route element={<RouteGuard allowedRoles={['PRESTADOR']} />}>
            <Route path={ROUTE_PATHS.provider} element={<Navigate to={getProviderPath()} replace />} />
            <Route path={`${ROUTE_PATHS.provider}/:section`} element={<ProviderDashboardPage />} />
          </Route>

          <Route element={<RouteGuard allowedRoles={['CLIENTE']} />}>
            <Route path={ROUTE_PATHS.client} element={<Navigate to={getClientPath()} replace />} />
            <Route path={`${ROUTE_PATHS.client}/:section`} element={<ClientDashboardPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to={ROUTE_PATHS.root} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
