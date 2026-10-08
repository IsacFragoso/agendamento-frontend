import AppHeader from '../../../shared/components/layouts/AppHeader';

export default function UnsupportedAccountPage() {
  return (
    <div className="app-single-page">
      <AppHeader />
      <main className="auth-page">
        <section className="auth-card">
          <span className="eyebrow">Acesso indisponível</span>
          <h1>Este perfil não tem um painel disponível.</h1>
          <p className="auth-card__subtitle">
            Esta aplicação atende clientes e prestadores. Entre com uma conta compatível para continuar.
          </p>
        </section>
      </main>
    </div>
  );
}