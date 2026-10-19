import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../store/use-auth';
import { PublicOnlyRoute, RouteGuard } from './RouteGuard';
import { ROUTE_PATHS, getDashboardPathForAccountType, getClientPath, getProviderPath } from './paths';
import LoginPage from '../../modules/auth/pages/LoginPage';
import RegisterPage from '../../modules/auth/pages/RegisterPage';
import AccountSettingsPage from '../../modules/auth/pages/AccountSettingsPage';
import ProviderOnboardingPage from '../../modules/auth/pages/ProviderOnboardingPage';
import UnsupportedAccountPage from '../../modules/auth/pages/UnsupportedAccountPage';
import ProviderDashboardPage from '../../modules/dashboard/pages/ProviderDashboardPage';
import ProviderPortfolioPage from '../../modules/dashboard/pages/ProviderPortfolioPage';
import ClientDashboardPage from '../../modules/dashboard/pages/ClientDashboardPage';
import MarketplacePage from '../../modules/providers/pages/MarketplacePage';
import ProviderProfilePage from '../../modules/providers/pages/ProviderProfilePage';
import BookingPage from '../../modules/providers/pages/BookingPage';
import AppLayout from '../../shared/components/layouts/AppLayout';
import PublicLayout from '../../shared/components/layouts/PublicLayout';

function RootRedirect() {
  const { isAuthenticated, user } = useAuth();
  return <Navigate to={isAuthenticated ? getDashboardPathForAccountType(user?.tipo_conta) : ROUTE_PATHS.marketplace} replace />;
}

function AppRedirect() {
  const { user } = useAuth();
  return <Navigate to={getDashboardPathForAccountType(user?.tipo_conta)} replace />;
}

function RoleDashboardPage() {
  const { user } = useAuth();
  return user?.tipo_conta === 'PRESTADOR'
    ? <ProviderDashboardPage />
    : <Navigate to={getClientPath('agendamentos')} replace />;
}

export function AppRouter() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Routes>
        <Route path={ROUTE_PATHS.root} element={<RootRedirect />} />
        <Route element={<PublicLayout />}>
          <Route path={ROUTE_PATHS.marketplace} element={<MarketplacePage />} />
          <Route path={ROUTE_PATHS.providerProfile} element={<ProviderProfilePage />} />
          <Route path={ROUTE_PATHS.providerBooking} element={<BookingPage />} />
        </Route>

        <Route element={<PublicOnlyRoute />}>
          <Route path={ROUTE_PATHS.login} element={<LoginPage />} />
          <Route path={ROUTE_PATHS.register} element={<RegisterPage />} />
        </Route>

        <Route element={<RouteGuard />}>
          <Route path={ROUTE_PATHS.app} element={<AppRedirect />} />
          <Route path={ROUTE_PATHS.unsupportedRole} element={<UnsupportedAccountPage />} />

          <Route element={<RouteGuard allowedRoles={['PRESTADOR', 'CLIENTE']} />}>
            <Route element={<AppLayout />}>
              <Route path={ROUTE_PATHS.dashboard} element={<RoleDashboardPage />} />
              <Route path={ROUTE_PATHS.settings} element={<AccountSettingsPage />} />

              <Route element={<RouteGuard allowedRoles={['PRESTADOR']} />}>
                <Route path={ROUTE_PATHS.provider} element={<Navigate to={getProviderPath()} replace />} />
                <Route path={ROUTE_PATHS.providerPortfolio} element={<ProviderPortfolioPage />} />
                <Route path={`${ROUTE_PATHS.provider}/:section`} element={<ProviderDashboardPage />} />
              </Route>

              <Route element={<RouteGuard allowedRoles={['CLIENTE']} />}>
                <Route path={ROUTE_PATHS.client} element={<Navigate to={getClientPath()} replace />} />
                <Route path={getClientPath('agenda')} element={<Navigate to={getClientPath('agendamentos')} replace />} />
                <Route path={ROUTE_PATHS.providerOnboarding} element={<ProviderOnboardingPage />} />
                <Route path={`${ROUTE_PATHS.client}/:section`} element={<ClientDashboardPage />} />
              </Route>
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to={ROUTE_PATHS.root} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
