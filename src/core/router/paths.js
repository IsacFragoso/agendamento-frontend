export const ROUTE_PATHS = {
  root: '/',
  marketplace: '/explorar',
  providers: '/profissionais',
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

export const PROVIDER_SECTIONS = ['inicio', 'agenda', 'portfolio', 'historico', 'perfil'];
export const CLIENT_SECTIONS = ['agenda', 'agendamentos', 'historico', 'perfil'];

export const getProviderPath = (section = 'inicio') => `${ROUTE_PATHS.provider}/${section}`;
export const getClientPath = (section = 'agenda') => `${ROUTE_PATHS.client}/${section}`;

export const getDashboardPathForAccountType = (accountType) => {
  const normalizedType = String(accountType || '').toUpperCase();

  if (normalizedType === 'PRESTADOR' || normalizedType === 'CLIENTE') return ROUTE_PATHS.dashboard;
  return ROUTE_PATHS.unsupportedRole;
};
