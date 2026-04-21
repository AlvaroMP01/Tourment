import { useState } from 'react';
import { mockPlayers } from '../data/mockData';

const Players = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filteredPlayers = mockPlayers.filter((player) => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.team.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || player.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roles = ['all', 'Duelist', 'Controller', 'Initiator', 'Sentinel'];

  return (
    <div className="min-h-screen bg-valorant-dark py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-6xl font-tungsten text-white tracking-wider mb-4">
            JUGADORES
          </h1>
          <div className="h-1 w-32 bg-valorant-red mb-4"></div>
          <p className="text-valorant-light text-lg">
            Estadísticas y rankings de los mejores jugadores
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Role Filters */}
          <div className="flex gap-2 flex-wrap">
            {roles.map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-6 py-2 font-bold uppercase text-sm clip-corner-sm transition-all ${
                  roleFilter === role
                    ? 'bg-valorant-red text-white'
                    : 'bg-valorant-dark-secondary text-valorant-light hover:bg-valorant-dark-tertiary'
                }`}
              >
                {role === 'all' ? 'Todos' : role}
              </button>
            ))}
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Buscar jugadores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-valorant w-full md:w-64"
          />
        </div>

        {/* Leaderboard */}
        <div className="card-valorant overflow-hidden">
          <div className="bg-valorant-dark-tertiary p-4">
            <h2 className="text-2xl font-tungsten text-white tracking-wider">
              TABLA DE CLASIFICACIÓN
            </h2>
          </div>

          {filteredPlayers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-valorant-dark-secondary">
                  <tr className="text-left text-xs text-valorant-light uppercase">
                    <th className="p-4">Rank</th>
                    <th className="p-4">Jugador</th>
                    <th className="p-4">Equipo</th>
                    <th className="p-4">Rol</th>
                    <th className="p-4">Agente</th>
                    <th className="p-4 text-center">K/D</th>
                    <th className="p-4 text-center">ADR</th>
                    <th className="p-4 text-center">HS%</th>
                    <th className="p-4 text-center">Clutches</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.map((player, index) => (
                    <tr
                      key={player.id}
                      className="border-b border-valorant-dark-tertiary hover:bg-valorant-dark-secondary transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center">
                          <span className={`text-2xl font-tungsten ${
                            player.rank === 1 ? 'text-valorant-gold' :
                            player.rank === 2 ? 'text-gray-400' :
                            player.rank === 3 ? 'text-orange-600' :
                            'text-white'
                          }`}>
                            #{player.rank}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-white font-bold">{player.name}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-valorant-light">{player.team}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-valorant-red text-sm font-bold">
                          {player.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-valorant-light">{player.mainAgent}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`font-bold ${
                          player.stats.kd >= 1.3 ? 'text-valorant-red' :
                          player.stats.kd >= 1.0 ? 'text-white' :
                          'text-valorant-light'
                        }`}>
                          {player.stats.kd.toFixed(2)}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-white">{player.stats.adr}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-white">{player.stats.hs}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-valorant-gold font-bold">
                          {player.stats.clutches}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-tungsten text-white mb-2">
                NO SE ENCONTRARON JUGADORES
              </h3>
              <p className="text-valorant-light">
                Intenta ajustar tus filtros de búsqueda
              </p>
            </div>
          )}
        </div>

        {/* Stats Legend */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card-valorant p-4">
            <div className="text-xs text-valorant-light uppercase mb-1">K/D</div>
            <div className="text-sm text-white">Kill/Death Ratio</div>
          </div>
          <div className="card-valorant p-4">
            <div className="text-xs text-valorant-light uppercase mb-1">ADR</div>
            <div className="text-sm text-white">Average Damage per Round</div>
          </div>
          <div className="card-valorant p-4">
            <div className="text-xs text-valorant-light uppercase mb-1">HS%</div>
            <div className="text-sm text-white">Headshot Percentage</div>
          </div>
          <div className="card-valorant p-4">
            <div className="text-xs text-valorant-light uppercase mb-1">Clutches</div>
            <div className="text-sm text-white">1vX Situations Won</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Players;
