export const ROUTE_PATHS = {
  root: '/',
  marketplace: '/explorar',
  providers: '/profissionais',
  login: '/login',
  register: '/cadastro',
  app: '/app',
  provider: '/app/prestador',
  client: '/app/cliente',
};

export const PROVIDER_SECTIONS = ['inicio', 'agenda', 'portfolio', 'historico', 'perfil'];
export const CLIENT_SECTIONS = ['agenda', 'agendamentos', 'historico', 'perfil'];

export const getProviderPath = (section = 'inicio') => `${ROUTE_PATHS.provider}/${section}`;
export const getClientPath = (section = 'agenda') => `${ROUTE_PATHS.client}/${section}`;

export const getDashboardPathForAccountType = (accountType, section) => {
  const isProvider = String(accountType || '').toUpperCase() === 'PRESTADOR';
  return isProvider
    ? getProviderPath(section || 'inicio')
    : getClientPath(section || 'agenda');
};
