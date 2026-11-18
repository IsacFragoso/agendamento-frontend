import { useState } from 'react';
import { ArrowLeft, BriefcaseBusiness, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../../../core/http/http-error';
import { ROUTE_PATHS } from '../../../core/router/paths';
import { useAuth } from '../../../core/store/use-auth';
import { becomeProvider } from '../services/account.service';
import './ProviderOnboardingPage.css';

export default function ProviderOnboardingPage() {
  const navigate = useNavigate();
  const { token, user, updateUser } = useAuth();
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [location, setLocation] = useState(null);
  const [isLocationConfirmed, setIsLocationConfirmed] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const getServiceLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Seu navegador não permite obter a localização. Você pode continuar sem coordenadas.');
      return;
    }

    setLocationError('');
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        });
        setIsLocationConfirmed(false);
        setIsLocating(false);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError('Permissão de localização negada. Você pode permitir o acesso nas configurações do navegador e tentar novamente.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setLocationError('Não foi possível determinar sua localização. Tente novamente ou continue sem coordenadas.');
        } else {
          setLocationError('A localização demorou para responder. Tente novamente ou continue sem coordenadas.');
        }
        setIsLocating(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    const normalizedBio = bio.trim();
    const normalizedCity = city.trim();
    const normalizedState = state.trim().toUpperCase();
    if (!normalizedBio) {
      setErrorMessage('Conte um pouco sobre seus serviços para continuar.');
      return;
    }
    if (normalizedCity.length > 100) {
      setErrorMessage('A cidade deve ter no máximo 100 caracteres.');
      return;
    }
    if (normalizedState && !/^[A-Z]{2}$/.test(normalizedState)) {
      setErrorMessage('Informe a sigla do estado com duas letras, como SP.');
      return;
    }
    if (location && !isLocationConfirmed) {
      setErrorMessage('Confirme que o ponto escolhido é onde você atende ou remova a localização para continuar sem coordenadas.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await becomeProvider(user.id, {
        bio: normalizedBio,
        ...(location && isLocationConfirmed
          ? { latitude: location.latitude, longitude: location.longitude }
          : {}),
        ...(normalizedCity ? { cidade: normalizedCity } : {}),
        ...(normalizedState ? { estado: normalizedState } : {}),
      }, token);

      if (!result.usuario) {
        throw new Error('Não foi possível atualizar os dados da sua conta.');
      }

      updateUser(result.usuario);
      navigate(ROUTE_PATHS.dashboard, { replace: true });
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível iniciar seu perfil profissional.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="provider-onboarding">
      <button
        className="provider-onboarding__back"
        type="button"
        onClick={() => navigate(ROUTE_PATHS.settings)}
      >
        <ArrowLeft size={17} aria-hidden="true" />
        Voltar às configurações
      </button>

      <section className="card provider-onboarding__card">
        <div className="provider-onboarding__heading">
          <span className="provider-onboarding__icon"><BriefcaseBusiness size={22} aria-hidden="true" /></span>
          <div>
            <p className="provider-onboarding__eyebrow">Perfil profissional</p>
            <h1>Comece a oferecer seus serviços</h1>
            <p>Apresente seu trabalho. Depois, você poderá completar seu perfil e cadastrar serviços no painel profissional.</p>
          </div>
        </div>

        {errorMessage ? <p className="feedback feedback--danger" role="alert">{errorMessage}</p> : null}

        <form className="provider-onboarding__form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Sobre seu trabalho</span>
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              placeholder="Conte quais serviços oferece e o que os clientes podem esperar do seu trabalho."
              rows="5"
              required
            />
            <small>Essa apresentação ficará visível no seu perfil profissional.</small>
          </label>

          <div className="provider-onboarding__location">
            <label className="field">
              <span>Cidade <small>(opcional)</small></span>
              <input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                maxLength="100"
                autoComplete="address-level2"
                placeholder="Ex.: São Paulo"
              />
            </label>
            <label className="field">
              <span>Estado <small>(opcional)</small></span>
              <input
                value={state}
                onChange={(event) => setState(event.target.value.replace(/[^a-z]/gi, '').slice(0, 2).toUpperCase())}
                maxLength="2"
                autoComplete="address-level1"
                placeholder="SP"
              />
            </label>
          </div>

          <section className="provider-onboarding__location-picker" aria-labelledby="provider-location-title">
            <div className="provider-onboarding__location-copy">
              <MapPin size={19} aria-hidden="true" />
              <div>
                <h2 id="provider-location-title">Local onde você atende</h2>
                <p>Use o GPS neste local para ajudar clientes próximos a encontrar seu perfil. A localização só é enviada ao salvar o cadastro; não consultamos serviços externos de mapas.</p>
              </div>
            </div>
            {location ? (
              <div className="provider-onboarding__location-selection">
                <p role="status">
                  Ponto capturado: {location.latitude.toFixed(8)}, {location.longitude.toFixed(8)}
                  {Number.isFinite(location.accuracy) ? ` · Precisão estimada: ${Math.round(location.accuracy)} m` : ''}
                </p>
                <label className="provider-onboarding__confirm-location">
                  <input
                    type="checkbox"
                    checked={isLocationConfirmed}
                    onChange={(event) => {
                      setIsLocationConfirmed(event.target.checked);
                      setErrorMessage('');
                    }}
                  />
                  <span>Confirmo que este ponto representa o local onde atendo.</span>
                </label>
                <button
                  className="provider-onboarding__location-remove"
                  type="button"
                  onClick={() => {
                    setLocation(null);
                    setIsLocationConfirmed(false);
                    setLocationError('');
                    setErrorMessage('');
                  }}
                >
                  Remover ponto
                </button>
              </div>
            ) : (
              <button
                className="button button--secondary provider-onboarding__locate"
                type="button"
                onClick={getServiceLocation}
                disabled={isLocating || isSubmitting}
              >
                <MapPin size={16} aria-hidden="true" />
                {isLocating ? 'Obtendo localização...' : 'Usar localização deste local'}
              </button>
            )}
            {locationError ? <p className="feedback feedback--danger" role="alert">{locationError}</p> : null}
            <p className="provider-onboarding__location-hint">
              Se preferir, informe cidade e estado acima e continue sem coordenadas. Nesse caso, seu perfil pode não aparecer em buscas por proximidade.
            </p>
          </section>

          <p className="provider-onboarding__note">
            Sua conta atual será convertida para profissional. Você continuará usando o mesmo acesso.
          </p>
          <div className="provider-onboarding__actions">
            <button className="button button--secondary" type="button" onClick={() => navigate(ROUTE_PATHS.settings)} disabled={isSubmitting}>
              Cancelar
            </button>
            <button className="button button--primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Preparando seu perfil...' : 'Tornar-me profissional'}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
