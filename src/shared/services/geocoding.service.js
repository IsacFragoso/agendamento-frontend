const REVERSE_GEOCODING_URL = 'https://nominatim.openstreetmap.org/reverse';

export const getCurrentCoordinates = () => new Promise((resolve, reject) => {
  if (!navigator.geolocation) {
    reject(new Error('Seu navegador não permite obter a localização.'));
    return;
  }

  navigator.geolocation.getCurrentPosition(
    ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
    () => reject(new Error('Não foi possível acessar sua localização.')),
    { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
  );
});

// Sends the coordinates to OpenStreetMap Nominatim to get a city name.
export const reverseGeocodeCity = async ({ latitude, longitude }) => {
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: latitude,
    lon: longitude,
    zoom: 12,
    'accept-language': 'pt-BR',
  });
  const response = await fetch(`${REVERSE_GEOCODING_URL}?${params}`);
  if (!response.ok) throw new Error('Não foi possível identificar sua cidade.');

  const { address = {} } = await response.json();
  const city = address.city || address.town || address.village || address.municipality;
  if (!city) throw new Error('Não foi possível identificar sua cidade.');

  return city;
};
