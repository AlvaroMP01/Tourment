import { useState } from 'react';
import AdminTournaments from '../components/admin/AdminTournaments';
import AdminTeams from '../components/admin/AdminTeams';
import AdminMatches from '../components/admin/AdminMatches';
import AdminPlayers from '../components/admin/AdminPlayers';
import AdminUsers from '../components/admin/AdminUsers';

const Admin = () => {
  const [activeSection, setActiveSection] = useState('tournaments');

  const sections = [
    { id: 'tournaments', name: 'Torneos', icon: '🏆' },
    { id: 'teams', name: 'Equipos', icon: '👥' },
    { id: 'matches', name: 'Partidos', icon: '⚔️' },
    { id: 'users', name: 'Jugadores', icon: '🎮' },
    { id: 'system_users', name: 'Usuarios', icon: '👤' },
  ];

  return (
    <div className="min-h-screen bg-valorant-dark py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-6xl font-tungsten text-white tracking-wider mb-4">
            PANEL DE ADMINISTRACIÓN
          </h1>
          <div className="h-1 w-32 bg-valorant-red mb-4"></div>
          <p className="text-valorant-light text-lg">
            Gestiona torneos, equipos y usuarios de la plataforma
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
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

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="card-valorant p-8">
              {activeSection === 'tournaments' && <AdminTournaments />}
              {activeSection === 'teams' && <AdminTeams />}
              {activeSection === 'matches' && <AdminMatches />}
              {activeSection === 'users' && <AdminPlayers />}
              {activeSection === 'system_users' && <AdminUsers />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
