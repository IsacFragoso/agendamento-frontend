export const ROUTE_PATHS = {
  root: '/',
  marketplace: '/explorar',
  providers: '/profissionais',
  providerProfile: '/profissionais/:providerId',
  providerBooking: '/profissionais/:providerId/agendar/:serviceId',
  login: '/login',
  register: '/cadastro',
  app: '/app',
  dashboard: '/app/dashboard',
  settings: '/app/configuracoes',
  provider: '/app/prestador',
  providerPortfolio: '/app/prestador/portfolio',
  providerOnboarding: '/app/cliente/tornar-prestador',
  client: '/app/cliente',
  unsupportedRole: '/app/acesso-indisponivel',
};

export const PROVIDER_SECTIONS = ['inicio', 'agenda', 'portfolio', 'historico', 'perfil'];
export const CLIENT_SECTIONS = ['agendamentos', 'historico', 'perfil'];

export const getProviderPath = (section = 'inicio') => `${ROUTE_PATHS.provider}/${section}`;
export const getClientPath = (section = 'agendamentos') => `${ROUTE_PATHS.client}/${section}`;
export const getProviderProfilePath = (providerId) => `${ROUTE_PATHS.providers}/${providerId}`;
export const getBookingPath = (providerId, serviceId) => `${getProviderProfilePath(providerId)}/agendar/${serviceId}`;

export const getDashboardPathForAccountType = (accountType) => {
  const normalizedType = String(accountType || '').toUpperCase();

  if (normalizedType === 'PRESTADOR') return ROUTE_PATHS.dashboard;
  if (normalizedType === 'CLIENTE') return getClientPath('agendamentos');
  return ROUTE_PATHS.unsupportedRole;
};
