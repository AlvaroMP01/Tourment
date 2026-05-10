import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  const navItems = [
    { name: 'Inicio', path: '/' },
    { name: 'Torneos', path: '/tournaments' },
    { name: 'Equipos', path: '/teams' },
    { name: 'Jugadores', path: '/players' },
    { name: 'Noticias', path: '/news' }
  ];

  if (user && ['player', 'coach', 'player_coach'].includes(user.role)) {
    navItems.push({ name: 'Mis Equipos', path: '/my-teams' });
  }

  if (user?.role === 'admin' || user?.role === 'tournament_manager') {
    navItems.push({
      name: user.role === 'admin' ? 'Admin' : 'Gestión',
      path: '/admin'
    });
  }


  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-valorant-dark-secondary border-b-2 border-valorant-dark-tertiary sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative w-12 h-12 group">
              <div className="absolute inset-0 bg-[#FF4655] blur rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-30 group-hover:animate-glow"/>
                <img
                  src="/favicon.png"
                  alt="Tourment logo"
                  className="w-full h-full object-cover "
                />
            </div>
            <div>
              <h1 className="text-2xl font-tungsten text-white tracking-wider">
                TOURMENT
              </h1>
              <p className="text-xs text-valorant-light opacity-70 -mt-1">
                PLATAFORMA DE TORNEOS DE VALORANT
              </p>
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  relative px-4 py-2 font-bold uppercase text-sm tracking-wider
                  transition-all duration-300 clip-corner-sm
                  ${isActive(item.path)
                    ? 'bg-valorant-red text-white'
                    : 'text-valorant-light hover:text-white hover:bg-valorant-dark-tertiary'
                  }
                `}
              >
                {item.name}
                {isActive(item.path) && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
                )}
              </Link>
            ))}
            {user ? (
              <Link
                to="/profile"
                className={`ml-4 px-4 py-2 font-bold uppercase text-sm tracking-wider transition-all duration-300 clip-corner-sm flex items-center gap-2 ${isActive('/profile') ? 'bg-valorant-red text-white' : 'border border-valorant-red text-valorant-red hover:bg-valorant-red hover:text-white'}`}
              >
                <span className="text-base">{user.nickname}</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="ml-4 px-4 py-2 font-bold uppercase text-sm tracking-wider bg-valorant-red text-white hover:bg-white hover:text-valorant-red transition-all duration-300 clip-corner-sm"
              >
                Login
              </Link>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-valorant-light hover:text-white p-2"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-valorant-dark-tertiary border-t border-valorant-dark-tertiary animate-fade-in">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  block px-4 py-3 font-bold uppercase text-sm tracking-wider
                  transition-all duration-300 clip-corner-sm
                  ${isActive(item.path)
                    ? 'bg-valorant-red text-white'
                    : 'text-valorant-light hover:text-white hover:bg-valorant-dark'
                  }
                `}
              >
                {item.name}
              </Link>
            ))}
            {user ? (
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 font-bold uppercase text-sm tracking-wider text-valorant-red hover:bg-valorant-dark transition-all duration-300 clip-corner-sm"
              >
                👤 Mi Perfil
              </Link>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 font-bold uppercase text-sm tracking-wider text-valorant-red hover:bg-valorant-dark transition-all duration-300 clip-corner-sm"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
