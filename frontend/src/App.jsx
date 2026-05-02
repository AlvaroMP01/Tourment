import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Tournaments from './pages/Tournaments';
import TournamentDetail from './pages/TournamentDetail';
import Teams from './pages/Teams';
import Players from './pages/Players';
import News from './pages/News';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Register from './pages/Register';
import MyTeams from './pages/MyTeams';
import Profile from './pages/Profile';
import TeamDetail from './pages/TeamDetail';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Navigate } from 'react-router-dom';

// Un componente simple para rutas que solo Admins pueden ver
// Podríamos crear un AdminRoute más complejo, pero esto es un buen comienzo
const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-valorant-dark">
          <Navbar />
          <Routes>
            {/* Rutas Públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route path="/tournaments/:id" element={<TournamentDetail />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/players" element={<Players />} />
            <Route path="/news" element={<News />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Rutas Protegidas (Cualquier usuario logueado) */}
            <Route path="/teams/:id" element={
              <ProtectedRoute>
                <TeamDetail />
              </ProtectedRoute>
            } />
            <Route path="/my-teams" element={
              <ProtectedRoute>
                <MyTeams />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />

            {/* Rutas de Admin (Solo Admin) */}
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminRoute>
                  <Admin />
                </AdminRoute>
              </ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          {/* Footer */}
          <footer className="bg-valorant-dark-secondary border-t-2 border-valorant-dark-tertiary mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <h3 className="text-2xl font-tungsten text-white mb-4 tracking-wider">
                    VALORANT TOURNAMENT
                  </h3>
                  <p className="text-valorant-light text-sm">
                    La plataforma líder de torneos de VALORANT en España.
                    Compite, domina y alcanza la cima.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-tungsten text-white mb-4 tracking-wider">
                    ENLACES RÁPIDOS
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <a href="/tournaments" className="text-valorant-light hover:text-valorant-red transition-colors">
                        Torneos
                      </a>
                    </li>
                    <li>
                      <a href="/teams" className="text-valorant-light hover:text-valorant-red transition-colors">
                        Equipos
                      </a>
                    </li>
                    <li>
                      <a href="/players" className="text-valorant-light hover:text-valorant-red transition-colors">
                        Jugadores
                      </a>
                    </li>
                    <li>
                      <a href="/news" className="text-valorant-light hover:text-valorant-red transition-colors">
                        Noticias
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-tungsten text-white mb-4 tracking-wider">
                    INFORMACIÓN
                  </h4>
                  <p className="text-valorant-light text-sm mb-2">
                    Proyecto desarrollado por Álvaro Morcillo Pérez
                  </p>
                  <p className="text-valorant-light text-sm">
                    Noticias proporcionadas por{' '}
                    <a
                      href="https://www.vlr.gg"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-valorant-red hover:text-white transition-colors"
                    >
                      VLR.gg
                    </a>
                  </p>
                </div>
              </div>
              <div className="divider-glow my-8"></div>
              <div className="text-center text-valorant-light text-sm">
                <p>© 2024 Valorant Tournament Platform. Todos los derechos reservados.</p>
                <p className="mt-2 text-xs opacity-70">
                  VALORANT es una marca registrada de Riot Games, Inc.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

