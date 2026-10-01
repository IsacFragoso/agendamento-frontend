const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80',
];

export const buildProviderCard = (provider, index) => {
  const services = Array.isArray(provider.servicos)
    ? provider.servicos
    : provider.servico
      ? [provider.servico]
      : [];
  const primaryService = services[0] || null;
  // parse price values that may come as formatted strings (e.g. "R$ 1.234,56" or "50,00")
  const parseNumericPrice = (value) => {
    if (value === null || value === undefined) return null;
    const raw = String(value).trim();
    if (raw === '') return null;
    // remove common currency symbols and whitespace
    let cleaned = raw.replace(/[^0-9,.-]/g, '');
    // if contains both dot and comma, assume dot is thousands separator and comma is decimal
    if (cleaned.indexOf('.') !== -1 && cleaned.indexOf(',') !== -1) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.indexOf(',') !== -1) {
      // only comma present: treat as decimal separator
      cleaned = cleaned.replace(',', '.');
    }
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  };
  // compute a robust numeric lowest price across all services and pick the corresponding service
  const servicePricePairs = services.map((s) => ({ service: s, price: parseNumericPrice(s.preco) }));
  const pricedPairs = servicePricePairs.filter((p) => p.price !== null && p.price !== undefined);
  let lowestNumericPrice = null;
  let lowestPriceService = null;
  if (pricedPairs.length > 0) {
    lowestNumericPrice = Math.min(...pricedPairs.map((p) => p.price));
    // pick the first service whose parsed price matches the lowest (use tolerance for floats)
    const EPS = 1e-9;
    const pair = pricedPairs.find((p) => Math.abs(p.price - lowestNumericPrice) < EPS);
    lowestPriceService = pair ? pair.service : pricedPairs[0].service;
  }
  // bookingService: prefer the lowest priced service, otherwise fall back to primary
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
    servicesCount: services.length,
    distanciaKm: provider.distancia_km,
    descricao: provider.perfil?.bio || bookingService?.descricao || '',
    // prefer the numeric lowest price across all services; fallback to bookingService price when present
    preco: (() => {
      if (lowestNumericPrice !== null) return lowestNumericPrice;
      if (!bookingService) {
        // fallback to top-level provider.preco if present
        const top = parseNumericPrice(provider.preco);
        return top !== null ? top : null;
      }
      const parsed = parseNumericPrice(bookingService.preco);
      return parsed !== null ? parsed : null;
    })(),
    image: provider.perfil?.imagem_banner || provider.perfil?.foto_perfil || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length],
    servico: bookingService,
  };
};