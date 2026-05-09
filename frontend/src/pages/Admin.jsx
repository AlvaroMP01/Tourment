import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import AdminTournaments from '../components/admin/AdminTournaments';
import AdminTeams from '../components/admin/AdminTeams';
import AdminMatches from '../components/admin/AdminMatches';
import AdminUsers from '../components/admin/AdminUsers';

// Cada sección declara qué roles pueden verla.
const ALL_SECTIONS = [
  { id: 'tournaments', name: 'Torneos', icon: '🏆', allowedRoles: ['admin', 'tournament_manager'], Component: AdminTournaments },
  { id: 'matches',     name: 'Partidos', icon: '⚔️', allowedRoles: ['admin', 'tournament_manager'], Component: AdminMatches },
  { id: 'teams',       name: 'Equipos',  icon: '👥', allowedRoles: ['admin'],                       Component: AdminTeams },
  { id: 'users',       name: 'Usuarios', icon: '👤', allowedRoles: ['admin'],                       Component: AdminUsers },
];

const Admin = () => {
  const { user } = useAuth();

  const sections = useMemo(
    () => ALL_SECTIONS.filter(s => s.allowedRoles.includes(user?.role)),
    [user?.role]
  );

  const [activeSection, setActiveSection] = useState(sections[0]?.id);
  const ActiveComponent = sections.find(s => s.id === activeSection)?.Component;

  const headerTitle = user?.role === 'admin'
    ? 'PANEL DE ADMINISTRACIÓN'
    : 'PANEL DE GESTIÓN';
  const headerSubtitle = user?.role === 'admin'
    ? 'Gestiona torneos, equipos y usuarios de la plataforma'
    : 'Gestiona los torneos y partidos del sistema';

  return (
    <div className="min-h-screen bg-valorant-dark py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl md:text-6xl font-tungsten text-white tracking-wider mb-4">
            {headerTitle}
          </h1>
          <div className="h-1 w-32 bg-valorant-red mb-4"></div>
          <p className="text-valorant-light text-lg">{headerSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="card-valorant p-4 space-y-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-4 py-3 font-bold uppercase text-sm clip-corner-sm transition-all flex items-center gap-3 ${
                    activeSection === section.id
                      ? 'bg-valorant-red text-white'
                      : 'text-valorant-light hover:bg-valorant-dark-tertiary hover:text-white'
                  }`}
                >
                  <span className="text-xl">{section.icon}</span>
                  {section.name}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="card-valorant p-8">
              {ActiveComponent ? <ActiveComponent /> : (
                <div className="text-center text-valorant-light py-8">
                  No tienes acceso a esta sección.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
