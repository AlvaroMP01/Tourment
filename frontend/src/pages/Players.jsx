import { useState, useEffect, useMemo } from 'react';
import { routesAPI } from '../services/routesAPI';

const ROLE_FILTERS = ['all', 'Duelist', 'Controller', 'Initiator', 'Sentinel'];

const computeKD = (kills, deaths) => {
  if (!deaths || deaths === 0) return kills || 0;
  return (kills || 0) / deaths;
};

const Players = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await routesAPI.getPlayers();
        if (!cancelled) setPlayers(data || []);
      } catch (err) {
        if (!cancelled) setError(err.message || 'No se pudieron cargar los jugadores');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const ranked = useMemo(() => {
    // El backend ya viene ordenado por matches_played desc, kills desc.
    // Asignamos un rank visual sobre ese orden.
    return players.map((p, idx) => ({ ...p, rank: idx + 1 }));
  }, [players]);

  const filtered = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return ranked.filter((p) => {
      const teamName = p.team?.team_name || '';
      const matchesSearch =
        p.nickname.toLowerCase().includes(search) ||
        teamName.toLowerCase().includes(search);
      const matchesRole = roleFilter === 'all' || p.team?.ingame_role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [ranked, searchTerm, roleFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-valorant-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-valorant-red"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-valorant-dark py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-6xl font-tungsten text-white tracking-wider mb-4">JUGADORES</h1>
          <div className="h-1 w-32 bg-valorant-red mb-4"></div>
          <p className="text-valorant-light text-lg">Estadísticas y rankings de los mejores jugadores</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-valorant-red p-4 mb-6 text-center text-red-400">{error}</div>
        )}

        <div className="mb-8 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex gap-2 flex-wrap">
            {ROLE_FILTERS.map((role) => (
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

          <input
            type="text"
            placeholder="Buscar jugadores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-valorant w-full md:w-64"
          />
        </div>

        <div className="card-valorant overflow-hidden">
          <div className="bg-valorant-dark-tertiary p-4">
            <h2 className="text-2xl font-tungsten text-white tracking-wider">TABLA DE CLASIFICACIÓN</h2>
          </div>

          {filtered.length > 0 ? (
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
                    <th className="p-4 text-center">Partidos</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const kd = computeKD(p.stats.kills, p.stats.deaths);
                    return (
                      <tr key={p.id} className="border-b border-valorant-dark-tertiary hover:bg-valorant-dark-secondary transition-colors">
                        <td className="p-4">
                          <span className={`text-2xl font-tungsten ${
                            p.rank === 1 ? 'text-valorant-gold' :
                            p.rank === 2 ? 'text-gray-400' :
                            p.rank === 3 ? 'text-orange-600' :
                            'text-white'
                          }`}>
                            #{p.rank}
                          </span>
                        </td>
                        <td className="p-4"><span className="text-white font-bold">{p.nickname}</span></td>
                        <td className="p-4">
                          <span className="text-valorant-light">
                            {p.team ? `${p.team.team_name} [${p.team.team_tag}]` : 'Sin equipo'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-valorant-red text-sm font-bold">{p.team?.ingame_role || '—'}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-valorant-light">{p.team?.favorite_agent || '—'}</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`font-bold ${
                            kd >= 1.3 ? 'text-valorant-red' :
                            kd >= 1.0 ? 'text-white' :
                            'text-valorant-light'
                          }`}>
                            {kd.toFixed(2)}
                          </span>
                        </td>
                        <td className="p-4 text-center"><span className="text-white">{p.stats.adr.toFixed(1)}</span></td>
                        <td className="p-4 text-center"><span className="text-white">{p.stats.hs_percentage.toFixed(1)}%</span></td>
                        <td className="p-4 text-center"><span className="text-valorant-gold font-bold">{p.stats.clutches}</span></td>
                        <td className="p-4 text-center"><span className="text-valorant-light">{p.stats.matches_played}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-tungsten text-white mb-2">NO SE ENCONTRARON JUGADORES</h3>
              <p className="text-valorant-light">
                {players.length === 0
                  ? 'Aún no hay jugadores con stats reportadas'
                  : 'Intenta ajustar tus filtros de búsqueda'}
              </p>
            </div>
          )}
        </div>

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
