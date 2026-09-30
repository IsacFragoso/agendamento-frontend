const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80',
];

export const buildProviderCard = (provider, index) => {
  const services = Array.isArray(provider.servicos) ? provider.servicos : [];
  const primaryService = services[0] || null;
  const lowestPriceService = services.reduce((lowest, service) => {
    const price = Number(service.preco);
    return Number.isFinite(price) && (lowest === null || price < Number(lowest.preco))
      ? service
      : lowest;
  }, null);
  const bookingService = lowestPriceService || primaryService;
  const categoryIds = [...new Set(
    services
      .map((service) => service.categoria?.id_categoria)
      .filter((categoryId) => categoryId !== undefined && categoryId !== null)
      .map(String),
  )];

  return {
    id: provider.id_prestador,
    nome: provider.nome_completo,
    categoria: bookingService?.categoria?.nome || 'Profissional',
    categoryIds,
    distanciaKm: provider.distancia_km,
    descricao: provider.perfil?.bio || bookingService?.descricao || '',
    preco: lowestPriceService ? Number(lowestPriceService.preco) : null,
    image: provider.perfil?.imagem_banner || provider.perfil?.foto_perfil || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length],
    servico: bookingService,
  };
};