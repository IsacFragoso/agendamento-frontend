import { Outlet } from 'react-router-dom';
import { useAuth } from '../../../core/store/use-auth';
import AppHeader from './AppHeader';
import AppLayout from './AppLayout';
import './AppHeader.css';

const SIDEBAR_ROLES = ['PRESTADOR', 'CLIENTE'];

export default function PublicLayout() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || SIDEBAR_ROLES.includes(user?.tipo_conta)) {
    return <AppLayout />;
  }

  return (
    <div className="app-single-page app-single-page--public">
      <AppHeader showBrand />
      <Outlet />
    </div>
  );
}
