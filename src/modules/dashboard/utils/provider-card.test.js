import { describe, expect, it } from 'vitest';
import { buildProviderCard } from './provider-card';

describe('buildProviderCard', () => {
  it('shows and selects the same lowest-priced service', () => {
    const firstService = {
      id_servico: 1,
      preco: 80,
      titulo: 'Consulta',
      categoria: { id_categoria: 3, nome: 'Clínica' },
    };
    const lowestPricedService = {
      id_servico: 2,
      preco: 50,
      titulo: 'Avaliação',
      categoria: { id_categoria: 5, nome: 'Avaliação' },
    };
    const card = buildProviderCard({
      id_prestador: 7,
      nome_completo: 'Pat Souza',
      servicos: [firstService, lowestPricedService],
    }, 0);

    expect(card.preco).toBe(50);
    expect(card.servico).toBe(lowestPricedService);
    expect(card.categoryIds).toEqual(['3', '5']);
  });
});