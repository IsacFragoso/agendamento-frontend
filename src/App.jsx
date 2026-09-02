import { AppRouter } from './core/router/AppRouter';
import { AuthProvider } from './core/store/auth-context';

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;