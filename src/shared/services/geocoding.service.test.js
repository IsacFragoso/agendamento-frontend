import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCurrentCoordinates, reverseGeocodeCity } from './geocoding.service';

describe('geocoding service', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests a fresh high-accuracy browser position', async () => {
    const getCurrentPosition = vi.fn((success) => success({
      coords: { latitude: -23.55, longitude: -46.63 },
    }));
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } });

    await expect(getCurrentCoordinates()).resolves.toEqual({
      latitude: -23.55,
      longitude: -46.63,
    });
    expect(getCurrentPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );
  });

  it('uses detailed reverse geocoding and a city-level locality instead of a county', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ address: { county: 'Distant County', town: 'Nearby Town' } }),
    }));

    await expect(reverseGeocodeCity({ latitude: -23.55, longitude: -46.63 })).resolves.toBe('Nearby Town');
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('zoom=12'));
  });

  it('does not present a county as the detected city', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ address: { county: 'Distant County' } }),
    }));

    await expect(reverseGeocodeCity({ latitude: -23.55, longitude: -46.63 }))
      .rejects.toThrow('Não foi possível identificar sua cidade.');
  });
});
