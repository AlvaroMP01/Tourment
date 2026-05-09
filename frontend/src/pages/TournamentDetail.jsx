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
  accepted: 'Inscrito',
  rejected: 'Rechazado',
};

const TOURNAMENT_MANAGER_ROLES = new Set(['admin', 'tournament_manager']);
const ALLOWED_BRACKET_SIZES = [4, 8, 16];

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

const BracketEmptyState = ({ isManager, acceptedCount, allowedSizes, onGenerate, disabled }) => {
  const canGenerate = allowedSizes.includes(acceptedCount);
  return (
    <div className="card-valorant p-8 text-center">
      <div className="text-5xl mb-3">🏆</div>
      <h3 className="text-2xl font-tungsten text-white mb-2 tracking-wider">SIN BRACKET GENERADO</h3>
      <p className="text-valorant-light mb-6">
        El bracket de eliminación directa requiere exactamente{' '}
        <span className="text-white font-bold">{allowedSizes.join(', ')}</span> equipos inscritos.
        Actualmente: <span className="text-white font-bold">{acceptedCount}</span>.
      </p>
      {isManager && (
        canGenerate ? (
          <button
            onClick={onGenerate}
            disabled={disabled}
            className="btn-valorant disabled:opacity-50"
          >
            GENERAR BRACKET
          </button>
        ) : (
          <p className="text-xs text-valorant-light italic">
            Esperá a tener una cantidad válida para generar el bracket.
          </p>
        )
      )}
    </div>
  );
};

const BracketMatchCard = ({ match }) => {
  const isFinished = match.status === 'finished';
  const winnerSlot = isFinished
    ? (match.score1 > match.score2 ? 1 : 2)
    : null;

  const renderTeam = (team, score, slot) => {
    const isWinner = winnerSlot === slot;
    const isPending = !team;
    return (
      <div className={`flex justify-between items-center px-3 py-2 ${isWinner ? 'bg-valorant-red/20' : ''}`}>
        <span className={`text-sm truncate ${isPending ? 'text-valorant-light italic' : isWinner ? 'text-white font-bold' : 'text-white'}`}>
          {team ? team.name : 'Por definir'}
        </span>
        <span className={`text-lg font-tungsten ml-2 ${isWinner ? 'text-valorant-red' : 'text-valorant-light'}`}>
          {score != null ? score : '-'}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-valorant-dark-tertiary border border-valorant-dark min-w-[180px] clip-corner-sm overflow-hidden">
      {renderTeam(match.team1, match.score1, 1)}
      <div className="border-t border-valorant-dark"></div>
      {renderTeam(match.team2, match.score2, 2)}
    </div>
  );
};

const BracketTree = ({ rounds }) => {
  if (rounds.length === 0) return null;
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-8 min-w-max">
        {rounds.map((round) => (
          <div key={round.round} className="flex flex-col">
            <h3 className="text-sm font-bold uppercase tracking-wider text-valorant-red mb-4 text-center">
              {round.name}
            </h3>
            <div className="flex-1 flex flex-col justify-around gap-4">
              {round.matches.map((match) => (
                <BracketMatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
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
  // En matches del bracket, team1_id/team2_id pueden ser null (slot vacío esperando avance).
  const matches = useMemo(() => {
    if (!tournament?.matches) return [];
    return tournament.matches.map((m) => {
      const [s1, s2] = parseScore(m.score);
      const team1 = m.team1_id != null
        ? (teamsById[m.team1_id] || { id: m.team1_id, name: `Team #${m.team1_id}` })
        : null;
      const team2 = m.team2_id != null
        ? (teamsById[m.team2_id] || { id: m.team2_id, name: `Team #${m.team2_id}` })
        : null;
      return {
        id: m.id,
        team1,
        team2,
        score1: s1,
        score2: s2,
        map: m.map,
        round: m.round,
        status: m.status,
        date: m.date,
        bracketRound: m.bracket_round,
        bracketPosition: m.bracket_position,
      };
    });
  }, [tournament, teamsById]);

  // Bracket: matches con bracketRound != null, agrupados por ronda y ordenados por position.
  const bracketRounds = useMemo(() => {
    const withBracket = matches.filter((m) => m.bracketRound != null);
    if (withBracket.length === 0) return [];
    const grouped = new Map();
    for (const m of withBracket) {
      if (!grouped.has(m.bracketRound)) grouped.set(m.bracketRound, []);
      grouped.get(m.bracketRound).push(m);
    }
    return Array.from(grouped.entries())
      .sort(([a], [b]) => a - b)
      .map(([round, list]) => ({
        round,
        name: list[0]?.round || `Ronda ${round}`,
        matches: list.sort((a, b) => (a.bracketPosition || 0) - (b.bracketPosition || 0)),
      }));
  }, [matches]);

  const bracketHasFinished = useMemo(
    () => bracketRounds.some((r) => r.matches.some((m) => m.status === 'finished')),
    [bracketRounds]
  );

  // Matches "jugables": ambos equipos asignados. En el bracket los slots vacíos
  // se omiten de las listas generales — solo aparecen en el árbol del bracket.
  const playableMatches = useMemo(
    () => matches.filter((m) => m.team1 && m.team2),
    [matches]
  );

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

  const handleGenerateBracket = async () => {
    if (!window.confirm(`¿Generar bracket con ${acceptedRegs.length} equipos? El emparejamiento es aleatorio.`)) return;
    setSubmitting(true);
    setError('');
    try {
      await routesAPI.generateBracket(id);
      flashMsg('Bracket generado');
      await loadAll();
    } catch (err) {
      setError(err.message || 'No se pudo generar el bracket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBracket = async () => {
    if (!window.confirm('¿Borrar el bracket? Se eliminarán TODOS los partidos del bracket. Esta acción no se puede deshacer.')) return;
    setSubmitting(true);
    setError('');
    try {
      await routesAPI.deleteBracket(id);
      flashMsg('Bracket eliminado');
      await loadAll();
    } catch (err) {
      setError(err.message || 'No se pudo borrar el bracket');
    } finally {
      setSubmitting(false);
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
            <h1 className="text-4xl md:text-6xl font-tungsten text-white tracking-wider mb-4">{tournament.name}</h1>
            {tournament.description && (
              <p className="text-xl text-valorant-light max-w-3xl">{tournament.description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-valorant-dark-secondary border-b-2 border-valorant-dark-tertiary sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 md:px-6 py-3 md:py-4 font-bold uppercase text-sm whitespace-nowrap transition-all clip-corner-sm ${
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
                <div className="text-xs text-valorant-light uppercase mb-2">Equipos Inscritos</div>
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
              {playableMatches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {playableMatches.slice(0, 4).map((match) => <MatchCard key={match.id} match={match} />)}
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
            {playableMatches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {playableMatches.map((match) => <MatchCard key={match.id} match={match} />)}
              </div>
            ) : (
              <div className="text-center py-12 text-valorant-light">Aún no hay partidos programados</div>
            )}
          </div>
        )}

        {activeTab === 'bracket' && (
          <div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <h2 className="text-3xl font-tungsten text-white tracking-wider">BRACKET</h2>
              {isManager && tournament.bracket_size != null && (
                <button
                  onClick={handleDeleteBracket}
                  disabled={submitting || bracketHasFinished}
                  title={bracketHasFinished ? 'No se puede borrar: ya hay partidos reportados' : ''}
                  className="px-4 py-2 text-xs font-bold uppercase border border-valorant-red text-valorant-red hover:bg-valorant-red hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Borrar bracket
                </button>
              )}
            </div>

            {tournament.bracket_size == null ? (
              <BracketEmptyState
                isManager={isManager}
                acceptedCount={acceptedRegs.length}
                allowedSizes={ALLOWED_BRACKET_SIZES}
                onGenerate={handleGenerateBracket}
                disabled={submitting}
              />
            ) : (
              <BracketTree rounds={bracketRounds} />
            )}
          </div>
        )}

        {activeTab === 'teams' && (
          <div>
            <h2 className="text-3xl font-tungsten text-white mb-6 tracking-wider">EQUIPOS INSCRITOS</h2>
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
                Aún no hay equipos inscritos.
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
