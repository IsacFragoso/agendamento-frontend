export const ROUTE_PATHS = {
  root: '/',
  login: '/login',
  register: '/cadastro',
  app: '/app',
  dashboard: '/app/dashboard',
  settings: '/app/configuracoes',
  provider: '/app/prestador',
  providerPortfolio: '/app/prestador/portfolio',
  client: '/app/cliente',
  unsupportedRole: '/app/acesso-indisponivel',
};

export const PROVIDER_SECTIONS = ['agenda', 'historico', 'perfil'];
export const CLIENT_SECTIONS = ['agenda', 'historico'];

export const getProviderPath = (section = 'agenda') => `${ROUTE_PATHS.provider}/${section}`;
export const getClientPath = (section = 'agenda') => `${ROUTE_PATHS.client}/${section}`;

export const getDashboardPathForAccountType = (accountType) => {
  const normalizedType = String(accountType || '').toUpperCase();

  if (normalizedType === 'PRESTADOR' || normalizedType === 'CLIENTE') return ROUTE_PATHS.dashboard;
  return ROUTE_PATHS.unsupportedRole;
};
