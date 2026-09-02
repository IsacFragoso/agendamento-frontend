export const ROUTE_PATHS = {
  root: '/',
  login: '/login',
  register: '/cadastro',
  app: '/app',
  provider: '/app/prestador',
  client: '/app/cliente',
};

export const PROVIDER_SECTIONS = ['agenda', 'historico', 'perfil'];
export const CLIENT_SECTIONS = ['agenda', 'historico', 'perfil'];

export const getProviderPath = (section = 'agenda') => `${ROUTE_PATHS.provider}/${section}`;
export const getClientPath = (section = 'agenda') => `${ROUTE_PATHS.client}/${section}`;

export const getDashboardPathForAccountType = (accountType, section = 'agenda') => (
  String(accountType || '').toUpperCase() === 'PRESTADOR'
    ? getProviderPath(section)
    : getClientPath(section)
);
