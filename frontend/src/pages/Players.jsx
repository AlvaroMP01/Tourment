import { useState, useEffect, useMemo } from 'react';
import { routesAPI } from '../services/routesAPI';
import Avatar from '../components/Avatar';
import TeamLogo from '../components/TeamLogo';

const ROLE_FILTERS = ['all', 'Duelist', 'Controller', 'Initiator', 'Sentinel'];

// Cada métrica define etiqueta, formateador y getter desde stats.
// El backend ya soporta sort_by para todas estas.
const METRICS = {
  kd:       { label: 'K/D',        title: 'K/D',        format: (v) => v.toFixed(2),     getter: (s) => s.kd },
  adr:      { label: 'ADR',        title: 'ADR',        format: (v) => v.toFixed(1),     getter: (s) => s.adr },
  hs:       { label: 'HS%',        title: 'HEADSHOT %', format: (v) => `${v.toFixed(1)}%`, getter: (s) => s.hs_percentage },
  clutches: { label: 'Clutches',   title: 'CLUTCHES',   format: (v) => String(v),        getter: (s) => s.clutches },
  kills:    { label: 'Kills',      title: 'KILLS',      format: (v) => String(v),        getter: (s) => s.kills },
  assists:  { label: 'Asistencias',title: 'ASISTENCIAS',format: (v) => String(v),        getter: (s) => s.assists },
  matches:  { label: 'Partidos',   title: 'PARTIDAS',   format: (v) => String(v),        getter: (s) => s.matches_played },
};

const METRIC_KEYS = Object.keys(METRICS);

const Players = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('kd');
  const [minMatches, setMinMatches] = useState(3);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await routesAPI.getPlayers({ sort_by: sortBy, min_matches: minMatches });
        if (!cancelled) setPlayers(data || []);
      } catch (err) {
        if (!cancelled) setError(err.message || 'No se pudieron cargar los jugadores');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [sortBy, minMatches]);

  // Backend ya viene ordenado por la métrica activa; aquí solo asignamos rank visual.
  const ranked = useMemo(
    () => players.map((p, idx) => ({ ...p, rank: idx + 1 })),
    [players]
  );

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

  const metric = METRICS[sortBy];
  const podium = filtered.slice(0, 3);
  const rest = filtered.slice(3);

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
        <div className="mb-8">
          <h1 className="text-4xl md:text-6xl font-tungsten text-white tracking-wider mb-4">
            TOP JUGADORES POR <span className="text-valorant-red">{metric.title}</span>
          </h1>
          <div className="h-1 w-32 bg-valorant-red mb-4"></div>
          <p className="text-valorant-light text-lg">
            Ranking de los mejores jugadores. Mínimo {minMatches} partida{minMatches === 1 ? '' : 's'} jugada{minMatches === 1 ? '' : 's'} para entrar al ranking.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-valorant-red p-4 mb-6 text-center text-red-400">{error}</div>
        )}

        <div className="card-valorant p-4 mb-8 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-4">
            <label className="block text-xs text-valorant-light uppercase mb-1">Ordenar por</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-valorant-dark border border-valorant-red/30 text-white p-2 font-bold uppercase focus:border-valorant-red focus:outline-none transition-colors"
            >
              {METRIC_KEYS.map((k) => (
                <option key={k} value={k}>{METRICS[k].label}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs text-valorant-light uppercase mb-1">Mínimo partidas</label>
            <input
              type="number"
              min="0"
              step="1"
              value={minMatches}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                setMinMatches(Number.isNaN(v) ? 0 : Math.max(0, v));
              }}
              className="w-full bg-valorant-dark border border-valorant-red/30 text-white p-2 focus:border-valorant-red focus:outline-none transition-colors"
            />
          </div>
          <div className="md:col-span-5">
            <label className="block text-xs text-valorant-light uppercase mb-1">Buscar</label>
            <input
              type="text"
              placeholder="Nickname o equipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-valorant-dark border border-valorant-red/30 text-white p-2 focus:border-valorant-red focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="mb-8 flex gap-2 flex-wrap">
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

        {podium.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {podium.map((p) => {
              const heroValue = METRICS[sortBy].getter(p.stats);
              const podiumColor = p.rank === 1
                ? 'border-valorant-gold shadow-[0_0_30px_rgba(255,184,28,0.25)]'
                : p.rank === 2
                ? 'border-gray-400'
                : 'border-orange-700';
              const rankColor = p.rank === 1
                ? 'text-valorant-gold'
                : p.rank === 2
                ? 'text-gray-400'
                : 'text-orange-600';
              return (
                <div
                  key={p.id}
                  className={`card-valorant border-t-4 ${podiumColor} p-6 text-center transition-transform hover:scale-[1.02]`}
                >
                  <div className={`text-5xl md:text-7xl font-tungsten ${rankColor} mb-2`}>#{p.rank}</div>
                  <div className="flex justify-center mb-3">
                    <Avatar path={p.avatar} size="lg" />
                  </div>
                  <div className="text-2xl font-tungsten text-white mb-1">{p.nickname}</div>
                  {p.team ? (
                    <div className="flex items-center justify-center gap-2 text-valorant-light text-sm mb-4">
                      <TeamLogo path={p.team.team_logo} size="xs" />
                      <span>{p.team.team_name} [{p.team.team_tag}]</span>
                    </div>
                  ) : (
                    <div className="text-valorant-light text-sm mb-4">Sin equipo</div>
                  )}
                  <div className="border-t border-valorant-dark-tertiary pt-4">
                    <div className="text-xs text-valorant-light uppercase mb-1">{metric.label}</div>
                    <div className="text-3xl md:text-5xl font-tungsten text-valorant-red">
                      {metric.format(heroValue)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="card-valorant overflow-hidden">
          <div className="bg-valorant-dark-tertiary p-4 flex justify-between items-center">
            <h2 className="text-2xl font-tungsten text-white tracking-wider">TABLA COMPLETA</h2>
            <span className="text-xs text-valorant-light uppercase">
              {filtered.length} jugador{filtered.length === 1 ? '' : 'es'}
            </span>
          </div>

          {rest.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-valorant-dark-secondary">
                  <tr className="text-left text-xs text-valorant-light uppercase">
                    <th className="p-4">Rank</th>
                    <th className="p-4">Jugador</th>
                    <th className="p-4">Equipo</th>
                    <th className="p-4">Rol</th>
                    <th className={`p-4 text-center ${sortBy === 'kd' ? 'text-valorant-red' : ''}`}>K/D</th>
                    <th className={`p-4 text-center ${sortBy === 'adr' ? 'text-valorant-red' : ''}`}>ADR</th>
                    <th className={`p-4 text-center ${sortBy === 'hs' ? 'text-valorant-red' : ''}`}>HS%</th>
                    <th className={`p-4 text-center ${sortBy === 'clutches' ? 'text-valorant-red' : ''}`}>Clutches</th>
                    <th className={`p-4 text-center ${sortBy === 'matches' ? 'text-valorant-red' : ''}`}>Partidos</th>
                  </tr>
                </thead>
                <tbody>
                  {rest.map((p) => (
                    <tr key={p.id} className="border-b border-valorant-dark-tertiary hover:bg-valorant-dark-secondary transition-colors">
                      <td className="p-4">
                        <span className="text-2xl font-tungsten text-white">#{p.rank}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar path={p.avatar} size="xs" />
                          <span className="text-white font-bold">{p.nickname}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {p.team ? (
                          <div className="flex items-center gap-2">
                            <TeamLogo path={p.team.team_logo} size="xs" />
                            <span className="text-valorant-light">{p.team.team_name} [{p.team.team_tag}]</span>
                          </div>
                        ) : (
                          <span className="text-valorant-light">Sin equipo</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="text-valorant-red text-sm font-bold">{p.team?.ingame_role || '—'}</span>
                      </td>
                      <td className={`p-4 text-center ${sortBy === 'kd' ? 'font-bold text-valorant-red' : ''}`}>
                        <span className={
                          p.stats.kd >= 1.3 ? 'text-valorant-red font-bold' :
                          p.stats.kd >= 1.0 ? 'text-white' : 'text-valorant-light'
                        }>{p.stats.kd.toFixed(2)}</span>
                      </td>
                      <td className={`p-4 text-center ${sortBy === 'adr' ? 'font-bold text-valorant-red' : 'text-white'}`}>
                        {p.stats.adr.toFixed(1)}
                      </td>
                      <td className={`p-4 text-center ${sortBy === 'hs' ? 'font-bold text-valorant-red' : 'text-white'}`}>
                        {p.stats.hs_percentage.toFixed(1)}%
                      </td>
                      <td className={`p-4 text-center ${sortBy === 'clutches' ? 'font-bold text-valorant-red' : 'text-valorant-gold'}`}>
                        {p.stats.clutches}
                      </td>
                      <td className={`p-4 text-center ${sortBy === 'matches' ? 'font-bold text-valorant-red' : 'text-valorant-light'}`}>
                        {p.stats.matches_played}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : podium.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-tungsten text-white mb-2">SIN JUGADORES EN EL RANKING</h3>
              <p className="text-valorant-light">
                {players.length === 0
                  ? `Ningún jugador alcanza el mínimo de ${minMatches} partida${minMatches === 1 ? '' : 's'}`
                  : 'Intenta ajustar los filtros de búsqueda'}
              </p>
            </div>
          ) : (
            <div className="text-center py-12 text-valorant-light text-sm">
              Solo hay {podium.length} jugador{podium.length === 1 ? '' : 'es'} en el ranking — los ves arriba.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Players;
