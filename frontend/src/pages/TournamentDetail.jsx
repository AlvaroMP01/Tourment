import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import MatchCard from '../components/MatchCard';
import { routesAPI } from '../services/routesAPI';

const STATUS_BADGE = {
  live: { className: 'badge-live', label: '● EN VIVO' },
  upcoming: { className: 'badge-upcoming', label: 'PRÓXIMAMENTE' },
  finished: { className: 'badge-completed', label: 'FINALIZADO' },
};

const formatDate = (raw) => {
  if (!raw) return '—';
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-ES');
};

const isHttpUrl = (s) => typeof s === 'string' && /^https?:\/\//i.test(s);

const parseScore = (raw) => {
  // Backend devuelve "13:11" como string. Devolvemos números o null.
  if (!raw || typeof raw !== 'string') return [null, null];
  const [a, b] = raw.split(':').map((s) => {
    const n = parseInt(s, 10);
    return Number.isNaN(n) ? null : n;
  });
  return [a ?? null, b ?? null];
};

const TournamentDetail = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [tournament, setTournament] = useState(null);
  const [teamsById, setTeamsById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [t, allTeams] = await Promise.all([
          routesAPI.getTournamentDetail(id),
          routesAPI.getTeams(),
        ]);
        if (cancelled) return;
        setTournament(t);
        const map = {};
        (allTeams || []).forEach((tm) => { map[tm.id] = tm; });
        setTeamsById(map);
      } catch (err) {
        if (!cancelled) setError(err.message || 'No se pudo cargar el torneo');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id]);

  // Hidrato cada match con team1/team2 objects + score como números.
  const matches = useMemo(() => {
    if (!tournament?.matches) return [];
    return tournament.matches.map((m) => {
      const [s1, s2] = parseScore(m.score);
      return {
        id: m.id,
        team1: teamsById[m.team1_id] || { id: m.team1_id, name: `Team #${m.team1_id}` },
        team2: teamsById[m.team2_id] || { id: m.team2_id, name: `Team #${m.team2_id}` },
        score1: s1,
        score2: s2,
        map: m.map,
        round: m.round,
        status: m.status,
        date: m.date,
      };
    });
  }, [tournament, teamsById]);

  // Bracket sintético: agrupar matches por round_name. Es lo que el modelo soporta hoy.
  const matchesByRound = useMemo(() => {
    const groups = new Map();
    for (const m of matches) {
      const key = m.round || 'Sin ronda';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(m);
    }
    return Array.from(groups.entries()).map(([name, list]) => ({ name, matches: list }));
  }, [matches]);

  const uniqueTeamIds = useMemo(() => {
    const ids = new Set();
    matches.forEach((m) => { ids.add(m.team1.id); ids.add(m.team2.id); });
    return ids;
  }, [matches]);

  if (loading) {
    return (
      <div className="min-h-screen bg-valorant-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-valorant-red"></div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-valorant-dark flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-4xl font-tungsten text-white mb-4">TORNEO NO ENCONTRADO</h2>
          {error && <p className="text-valorant-light text-sm mb-4">{error}</p>}
          <Link to="/tournaments" className="btn-valorant">Volver a Torneos</Link>
        </div>
      </div>
    );
  }

  const badge = STATUS_BADGE[tournament.status];

  const tabs = [
    { id: 'overview', name: 'Resumen' },
    { id: 'matches', name: 'Partidos' },
    { id: 'bracket', name: 'Bracket' },
  ];

  return (
    <div className="min-h-screen bg-valorant-dark">
      {/* Header: imagen URL real, emoji grande, o fallback de gradiente. */}
      <div className="relative h-72 overflow-hidden bg-gradient-to-br from-valorant-dark via-valorant-dark-secondary to-valorant-red/40">
        {isHttpUrl(tournament.image) ? (
          <img src={tournament.image} alt={tournament.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : tournament.image ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-9xl opacity-60">{tournament.image}</span>
          </div>
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-valorant-dark via-valorant-dark/80 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
              {badge && <span className={badge.className}>{badge.label}</span>}
            </div>
            <h1 className="text-6xl font-tungsten text-white tracking-wider mb-4">{tournament.name}</h1>
            {tournament.description && (
              <p className="text-xl text-valorant-light max-w-3xl">{tournament.description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-valorant-dark-secondary border-b-2 border-valorant-dark-tertiary sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-bold uppercase text-sm transition-all clip-corner-sm ${
                  activeTab === tab.id
                    ? 'bg-valorant-red text-white'
                    : 'text-valorant-light hover:text-white hover:bg-valorant-dark-tertiary'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="card-valorant p-6 text-center">
                <div className="text-xs text-valorant-light uppercase mb-2">Premio</div>
                <div className="text-2xl font-tungsten text-valorant-red">
                  {tournament.prize || 'Por determinar'}
                </div>
              </div>
              <div className="card-valorant p-6 text-center">
                <div className="text-xs text-valorant-light uppercase mb-2">Equipos</div>
                <div className="text-3xl font-tungsten text-white">{uniqueTeamIds.size}</div>
              </div>
              <div className="card-valorant p-6 text-center">
                <div className="text-xs text-valorant-light uppercase mb-2">Inicio</div>
                <div className="text-xl font-tungsten text-white">{formatDate(tournament.start_date)}</div>
              </div>
              <div className="card-valorant p-6 text-center">
                <div className="text-xs text-valorant-light uppercase mb-2">Fin</div>
                <div className="text-xl font-tungsten text-white">{formatDate(tournament.end_date)}</div>
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-tungsten text-white mb-6 tracking-wider">PARTIDOS RECIENTES</h2>
              {matches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {matches.slice(0, 4).map((match) => <MatchCard key={match.id} match={match} />)}
                </div>
              ) : (
                <div className="text-center py-12 text-valorant-light">Aún no hay partidos programados</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'matches' && (
          <div>
            <h2 className="text-3xl font-tungsten text-white mb-6 tracking-wider">TODOS LOS PARTIDOS</h2>
            {matches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {matches.map((match) => <MatchCard key={match.id} match={match} />)}
              </div>
            ) : (
              <div className="text-center py-12 text-valorant-light">Aún no hay partidos programados</div>
            )}
          </div>
        )}

        {activeTab === 'bracket' && (
          <div>
            <h2 className="text-3xl font-tungsten text-white mb-6 tracking-wider">PARTIDOS POR RONDA</h2>
            <p className="text-xs text-valorant-light italic mb-6">
              El modelo aún no soporta brackets con avance automático. Esta vista agrupa los partidos por su nombre de ronda.
            </p>

            {matchesByRound.length > 0 ? (
              <div className="space-y-8">
                {matchesByRound.map((round) => (
                  <div key={round.name} className="card-valorant p-6">
                    <h3 className="text-2xl font-tungsten text-valorant-red mb-4 tracking-wider">{round.name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {round.matches.map((match) => (
                        <div key={match.id} className="bg-valorant-dark-tertiary p-4 clip-corner-sm">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-white font-bold">{match.team1.name}</span>
                            <span className="text-2xl font-tungsten text-valorant-red">
                              {match.score1 != null ? match.score1 : '-'}
                            </span>
                          </div>
                          <div className="divider-glow my-2"></div>
                          <div className="flex justify-between items-center">
                            <span className="text-white font-bold">{match.team2.name}</span>
                            <span className="text-2xl font-tungsten text-white">
                              {match.score2 != null ? match.score2 : '-'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-valorant-light">Aún no hay partidos programados</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentDetail;
