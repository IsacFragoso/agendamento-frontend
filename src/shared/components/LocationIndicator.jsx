import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { getCurrentCoordinates, reverseGeocodeCity } from '../services/geocoding.service';

const STORAGE_KEY = 'sapne:user-location';

const readStoredLocation = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
};

export default function LocationIndicator() {
  const [city, setCity] = useState(readStoredLocation);
  const [isLocating, setIsLocating] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    const locate = async () => {
      try {
        const found = await reverseGeocodeCity(await getCurrentCoordinates());
        if (!isCurrent) return;
        setCity(found);
        try {
          localStorage.setItem(STORAGE_KEY, found);
        } catch {
          // Keep the detected city in memory when storage is unavailable.
        }
      } catch {
        if (isCurrent) {
          setCity('');
          setHasError(true);
        }
      } finally {
        if (isCurrent) setIsLocating(false);
      }
    };

    locate();
    return () => {
      isCurrent = false;
    };
  }, []);

  const label = city || (isLocating
    ? 'Detectando localização...'
    : hasError ? 'Localização indisponível' : 'Localização não definida');

  return (
    <div className="app-header__location" title={label}>
      <MapPin size={16} strokeWidth={2} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
