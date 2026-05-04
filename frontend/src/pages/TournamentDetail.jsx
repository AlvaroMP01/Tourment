import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import MatchCard from '../components/MatchCard';
import TournamentImage from '../components/TournamentImage';
import TeamLogo from '../components/TeamLogo';
import { routesAPI } from '../services/routesAPI';
import { formatPrize } from '../services/adapters';
import { useAuth } from '../context/AuthContext';

const STATUS_BADGE = {
  live: { className: 'badge-live', label: '● EN VIVO' },
  upcoming: { className: 'badge-upcoming', label: 'PRÓXIMAMENTE' },
  finished: { className: 'badge-completed', label: 'FINALIZADO' },
};

const REG_STATUS_BADGE = {
  pending: 'bg-valorant-gold/20 border-valorant-gold text-valorant-gold',
  accepted: 'bg-green-700/20 border-green-500 text-green-400',
  rejected: 'bg-red-700/20 border-valorant-red text-valorant-red',
};

const REG_STATUS_LABEL = {
  pending: 'Solicitud pendiente',
  accepted: 'Inscripto',
  rejected: 'Rechazado',
};

const TOURNAMENT_MANAGER_ROLES = new Set(['admin', 'tournament_manager']);

const formatDate = (raw) => {
  if (!raw) return '—';
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-ES');
};

const parseScore = (raw) => {
  if (!raw || typeof raw !== 'string') return [null, null];
  const [a, b] = raw.split(':').map((s) => {
    const n = parseInt(s, 10);
    return Number.isNaN(n) ? null : n;
  });
  return [a ?? null, b ?? null];
};

const TournamentDetail = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [tournament, setTournament] = useState(null);
  const [teamsById, setTeamsById] = useState({});
  const [registrations, setRegistrations] = useState([]);
  const [myFounderTeams, setMyFounderTeams] = useState([]); // teams donde el user es founder
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isManager = isAuthenticated && user && TOURNAMENT_MANAGER_ROLES.has(user.role);
  const canRegister = tournament?.status === 'upcoming';

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [t, allTeams, regs] = await Promise.all([
        routesAPI.getTournamentDetail(id),
        routesAPI.getTeams(),
        routesAPI.listTournamentRegistrations(id).catch(() => []),
      ]);
      setTournament(t);
      const map = {};
      (allTeams || []).forEach((tm) => { map[tm.id] = tm; });
      setTeamsById(map);
      setRegistrations(regs || []);

      // Founder detection: para cada team del usuario, traemos detalle y vemos
      // si es founder. Es N+1 pero suele ser N=1.
      if (isAuthenticated && user) {
        try {
          const myTeams = await routesAPI.getMyTeams();
          const founders = await Promise.all(myTeams.map(async (mt) => {
            const detail = await routesAPI.getTeamDetail(mt.id);
            return detail.founder_user_id === user.id ? mt : null;
          }));
          setMyFounderTeams(founders.filter(Boolean));
        } catch {
          setMyFounderTeams([]);
        }
      } else {
        setMyFounderTeams([]);
      }
    } catch (err) {
      setError(err.message || 'No se pudo cargar el torneo');
    } finally {
      setLoading(false);
    }
  }, [id, isAuthenticated, user]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const flashMsg = (msg) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 3000);
  };

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

  const matchesByRound = useMemo(() => {
    const groups = new Map();
    for (const m of matches) {
      const key = m.round || 'Sin ronda';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(m);
    }
    return Array.from(groups.entries()).map(([name, list]) => ({ name, matches: list }));
  }, [matches]);

  const acceptedRegs = useMemo(() => registrations.filter(r => r.status === 'accepted'), [registrations]);
  const pendingRegs = useMemo(() => registrations.filter(r => r.status === 'pending'), [registrations]);

  // ¿El user tiene un equipo (donde es founder) ya registrado en este torneo?
  // Como un user solo puede ser founder de UN team (regla actual), tomo el primero.
  const myFounderTeam = myFounderTeams[0] || null;
  const myRegistration = useMemo(() => {
    if (!myFounderTeam) return null;
    return registrations.find(r => r.team_id === myFounderTeam.id) || null;
  }, [myFounderTeam, registrations]);

  const handleRegister = async () => {
    if (!myFounderTeam) return;
    setSubmitting(true);
    setError('');
    try {
      await routesAPI.registerTeamToTournament(id, myFounderTeam.id);
      flashMsg(`Solicitud enviada para ${myFounderTeam.name}`);
      await loadAll();
    } catch (err) {
      setError(err.message || 'No se pudo enviar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!myRegistration) return;
    if (!window.confirm('¿Retirar la solicitud de inscripción?')) return;
    setSubmitting(true);
    setError('');
    try {
      await routesAPI.deleteTournamentRegistration(id, myRegistration.id);
      flashMsg('Solicitud retirada');
      await loadAll();
    } catch (err) {
      setError(err.message || 'No se pudo retirar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptReg = async (regId) => {
    setError('');
    try {
      await routesAPI.acceptTournamentRegistration(id, regId);
      flashMsg('Inscripción aceptada');
      await loadAll();
    } catch (err) {
      setError(err.message || 'No se pudo aceptar');
    }
  };

  const handleRejectReg = async (regId) => {
    if (!window.confirm('¿Rechazar esta inscripción?')) return;
    setError('');
    try {
      await routesAPI.rejectTournamentRegistration(id, regId);
      flashMsg('Inscripción rechazada');
      await loadAll();
    } catch (err) {
      setError(err.message || 'No se pudo rechazar');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-valorant-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-valorant-red"></div>
      </div>
    );
  }

  if (error && !tournament) {
    return (
      <div className="min-h-screen bg-valorant-dark flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-4xl font-tungsten text-white mb-4">TORNEO NO ENCONTRADO</h2>
          <p className="text-valorant-light text-sm mb-4">{error}</p>
          <Link to="/tournaments" className="btn-valorant">Volver a Torneos</Link>
        </div>
      </div>
    );
  }

  if (!tournament) return null;

  const badge = STATUS_BADGE[tournament.status];
  const tabs = [
    { id: 'overview', name: 'Resumen' },
    { id: 'matches', name: 'Partidos' },
    { id: 'bracket', name: 'Bracket' },
    { id: 'teams', name: `Equipos (${acceptedRegs.length})` },
  ];

  return (
    <div className="min-h-screen bg-valorant-dark">
      <div className="relative h-72 overflow-hidden">
        <TournamentImage
          path={tournament.image}
          name={tournament.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
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
        {actionMsg && (
          <div className="bg-green-500/20 border border-green-500 p-3 mb-6 text-green-400 text-sm font-bold text-center">
            {actionMsg}
          </div>
        )}
        {error && (
          <div className="bg-red-500/20 border border-valorant-red p-3 mb-6 text-valorant-light text-sm text-center">
            {error}
          </div>
        )}

        {/* Banner de inscripción del founder (visible en cualquier tab) */}
        {isAuthenticated && myFounderTeam && (
          <div className="card-valorant p-5 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <TeamLogo path={myFounderTeam.logo} size="sm" />
              <div>
                <div className="text-xs text-valorant-light uppercase">Tu equipo</div>
                <div className="text-2xl font-tungsten text-white">{myFounderTeam.name} <span className="text-valorant-red">[{myFounderTeam.tag}]</span></div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {myRegistration ? (
                <>
                  <span className={`px-3 py-1 text-xs font-bold uppercase border clip-corner-sm ${REG_STATUS_BADGE[myRegistration.status]}`}>
                    {REG_STATUS_LABEL[myRegistration.status]}
                  </span>
                  {myRegistration.status === 'pending' && (
                    <button
                      onClick={handleWithdraw}
                      disabled={submitting}
                      className="px-4 py-2 text-xs font-bold uppercase border border-valorant-red text-valorant-red hover:bg-valorant-red hover:text-white transition-colors disabled:opacity-50"
                    >
                      Retirar solicitud
                    </button>
                  )}
                </>
              ) : canRegister ? (
                <button
                  onClick={handleRegister}
                  disabled={submitting}
                  className="btn-valorant disabled:opacity-50"
                >
                  {submitting ? 'ENVIANDO...' : 'INSCRIBIR EQUIPO'}
                </button>
              ) : (
                <span className="text-xs text-valorant-light italic">
                  Inscripciones cerradas (torneo {tournament.status})
                </span>
              )}
            </div>
          </div>
        )}

        {/* Panel admin de pendientes (visible para manager con cualquier tab) */}
        {isManager && pendingRegs.length > 0 && (
          <div className="card-valorant p-5 mb-8 border-l-4 border-valorant-gold">
            <h3 className="text-xl font-tungsten text-valorant-gold tracking-wider mb-4">
              SOLICITUDES PENDIENTES ({pendingRegs.length})
            </h3>
            <div className="space-y-2">
              {pendingRegs.map((r) => (
                <div key={r.id} className="flex items-center justify-between bg-valorant-dark-tertiary p-3">
                  <div className="flex items-center gap-3">
                    <TeamLogo path={r.team_logo} size="xs" />
                    <div>
                      <div className="text-white font-bold">{r.team_name} <span className="text-valorant-red">[{r.team_tag}]</span></div>
                      <div className="text-xs text-valorant-light">
                        Solicitado el {r.created_at ? new Date(r.created_at).toLocaleDateString('es-ES') : '—'}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptReg(r.id)}
                      className="px-4 py-1 bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white font-bold uppercase text-xs transition-colors"
                    >
                      Aceptar
                    </button>
                    <button
                      onClick={() => handleRejectReg(r.id)}
                      className="px-4 py-1 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white font-bold uppercase text-xs transition-colors"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="card-valorant p-6 text-center">
                <div className="text-xs text-valorant-light uppercase mb-2">Premio</div>
                <div className="text-2xl font-tungsten text-valorant-red">
                  {formatPrize(tournament.prize_amount, tournament.prize_currency)}
                </div>
              </div>
              <div className="card-valorant p-6 text-center">
                <div className="text-xs text-valorant-light uppercase mb-2">Equipos Inscriptos</div>
                <div className="text-3xl font-tungsten text-white">{acceptedRegs.length}</div>
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

        {activeTab === 'teams' && (
          <div>
            <h2 className="text-3xl font-tungsten text-white mb-6 tracking-wider">EQUIPOS INSCRIPTOS</h2>
            {acceptedRegs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {acceptedRegs.map((r) => (
                  <Link
                    key={r.id}
                    to={`/teams/${r.team_id}`}
                    className="card-valorant p-4 flex items-center gap-4 hover:scale-[1.02] transition-transform"
                  >
                    <TeamLogo path={r.team_logo} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xl font-tungsten text-white truncate">{r.team_name}</div>
                      <div className="text-valorant-red font-bold text-sm">[{r.team_tag}]</div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-valorant-light">
                Aún no hay equipos inscriptos.
                {tournament.status === 'upcoming' && myFounderTeam && !myRegistration && (
                  <span> ¡Sé el primero!</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentDetail;
