import { useEffect, useMemo, useState } from 'react';
import { routesAPI } from '../../services/routesAPI';
import Modal from '../Modal';

const emptyStats = () => ({
  selected: false,
  kills: '',
  deaths: '',
  assists: '',
  clutches: '',
  adr: '',
  hs_percentage: '',
});

const STAT_FIELDS = [
  { key: 'kills', label: 'K', step: '1', max: 999 },
  { key: 'deaths', label: 'D', step: '1', max: 999 },
  { key: 'assists', label: 'A', step: '1', max: 999 },
  { key: 'clutches', label: 'CL', step: '1', max: 999 },
  { key: 'adr', label: 'ADR', step: '0.1', max: 999 },
  { key: 'hs_percentage', label: 'HS%', step: '0.1', max: 100 },
];

const PLAYABLE_ROLES = new Set(['player', 'player_coach']);

const parseStrictInt = (v) => {
  if (v === '' || v === null || v === undefined) return NaN;
  const s = String(v).trim();
  if (!/^-?\d+$/.test(s)) return NaN;
  return parseInt(s, 10);
};

const AdminReportMatchModal = ({ tournamentId, match, teamsCatalog, isOpen, onClose, onReported }) => {
  const [team1, setTeam1] = useState(null);
  const [team2, setTeam2] = useState(null);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [scoreTeam1, setScoreTeam1] = useState('');
  const [scoreTeam2, setScoreTeam2] = useState('');
  const [playerStats, setPlayerStats] = useState({});

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const teamLabel = (id) => {
    const t = teamsCatalog?.find(x => x.id === id);
    return t ? `${t.name} [${t.tag}]` : `#${id}`;
  };

  useEffect(() => {
    if (!isOpen || !match) return;

    let cancelled = false;
    const load = async () => {
      setLoadingTeams(true);
      setLoadError('');
      setSubmitError('');
      setScoreTeam1('');
      setScoreTeam2('');
      setPlayerStats({});
      try {
        const [t1, t2] = await Promise.all([
          routesAPI.getTeamDetail(match.team1_id),
          routesAPI.getTeamDetail(match.team2_id),
        ]);
        if (cancelled) return;
        setTeam1(t1);
        setTeam2(t2);
        const initial = {};
        [...t1.members, ...t2.members].forEach(m => {
          if (m.occupies_slot && PLAYABLE_ROLES.has(m.role)) {
            initial[m.user_id] = emptyStats();
          }
        });
        setPlayerStats(initial);
      } catch (err) {
        if (!cancelled) setLoadError(err.message || 'No se pudieron cargar los equipos');
      } finally {
        if (!cancelled) setLoadingTeams(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [isOpen, match]);

  const playableMembers = (team) =>
    team?.members.filter(m => m.occupies_slot && PLAYABLE_ROLES.has(m.role)) || [];

  const team1Members = useMemo(() => playableMembers(team1), [team1]);
  const team2Members = useMemo(() => playableMembers(team2), [team2]);

  const toggleSelected = (userId) => {
    setPlayerStats(prev => ({
      ...prev,
      [userId]: { ...prev[userId], selected: !prev[userId]?.selected },
    }));
  };

  const updateStat = (userId, field, value) => {
    setPlayerStats(prev => ({
      ...prev,
      [userId]: { ...prev[userId], [field]: value },
    }));
  };

  const validatePayload = () => {
    const s1 = parseStrictInt(scoreTeam1);
    const s2 = parseStrictInt(scoreTeam2);
    if (Number.isNaN(s1) || Number.isNaN(s2)) {
      return { error: 'Los scores son obligatorios y deben ser enteros (sin decimales)' };
    }
    if (s1 < 0 || s2 < 0) return { error: 'Los scores no pueden ser negativos' };

    const selected = Object.entries(playerStats).filter(([, v]) => v.selected);
    if (selected.length === 0) {
      return { error: 'Marca al menos un jugador para reportar stats' };
    }

    const players = [];
    for (const [userId, v] of selected) {
      for (const f of STAT_FIELDS) {
        if (v[f.key] === '' || v[f.key] === null || v[f.key] === undefined) {
          return { error: `Falta '${f.label}' para un jugador seleccionado` };
        }
      }
      const k = parseStrictInt(v.kills);
      const d = parseStrictInt(v.deaths);
      const a = parseStrictInt(v.assists);
      const c = parseStrictInt(v.clutches);
      const adr = parseFloat(v.adr);
      const hs = parseFloat(v.hs_percentage);

      if ([k, d, a, c].some(n => Number.isNaN(n))) {
        return { error: 'K/D/A/CL deben ser enteros (sin decimales)' };
      }
      if ([k, d, a, c].some(n => n < 0)) {
        return { error: 'K/D/A/CL no pueden ser negativos' };
      }
      if (Number.isNaN(adr) || adr < 0) return { error: 'ADR debe ser numérico >= 0' };
      if (Number.isNaN(hs) || hs < 0 || hs > 100) return { error: 'HS% debe estar entre 0 y 100' };

      players.push({
        user_id: parseStrictInt(userId),
        kills: k, deaths: d, assists: a, clutches: c,
        adr, hs_percentage: hs,
      });
    }

    return { payload: { score_team1: s1, score_team2: s2, players } };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    const { error, payload } = validatePayload();
    if (error) {
      setSubmitError(error);
      return;
    }
    if (!window.confirm(
      `Reportar resultado ${payload.score_team1}-${payload.score_team2} con ${payload.players.length} jugador(es)?\n\n` +
      'Esta acción es irreversible: el match queda finished y los stats se suman a los agregados de cada jugador.'
    )) return;

    setSubmitting(true);
    try {
      await routesAPI.reportMatchResults(tournamentId, match.id, payload);
      onReported?.();
      onClose();
    } catch (err) {
      setSubmitError(err.message || 'No se pudo reportar el resultado');
    } finally {
      setSubmitting(false);
    }
  };

  const renderTeamSection = (team, members, score, setScore, accentBorder) => (
    <div className={`bg-valorant-dark-tertiary p-4 border-l-4 ${accentBorder}`}>
      <div className="flex items-center justify-between mb-4 gap-4">
        <div>
          <h3 className="text-2xl font-tungsten text-white tracking-wider uppercase">
            {team?.name || '...'}
          </h3>
          <span className="text-xs text-valorant-light">[{team?.tag}]</span>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-valorant-light mb-1 text-right">Score</label>
          <input
            type="number" min="0" step="1" required value={score}
            onChange={(e) => setScore(e.target.value)}
            className="w-24 bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white text-2xl font-tungsten text-center"
          />
        </div>
      </div>

      {members.length === 0 ? (
        <p className="text-xs italic text-valorant-light">El equipo no tiene jugadores activos en plantilla</p>
      ) : (
        <div className="space-y-2">
          {members.map(m => {
            const stats = playerStats[m.user_id] || emptyStats();
            return (
              <div
                key={m.user_id}
                className={`p-3 border ${stats.selected ? 'border-valorant-red bg-valorant-dark-secondary' : 'border-valorant-dark bg-valorant-dark'}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="checkbox" checked={stats.selected}
                    onChange={() => toggleSelected(m.user_id)}
                    className="w-4 h-4 accent-valorant-red"
                  />
                  <div className="flex-1">
                    <span className="font-bold text-white">{m.nickname}</span>
                    {m.ingame_role && (
                      <span className="text-xs text-valorant-light ml-2">
                        {m.ingame_role}{m.favorite_agent ? ` · ${m.favorite_agent}` : ''}
                      </span>
                    )}
                  </div>
                </div>
                {stats.selected && (
                  <div className="grid grid-cols-6 gap-2 mt-2">
                    {STAT_FIELDS.map(f => (
                      <div key={f.key}>
                        <label className="block text-[10px] font-bold uppercase text-valorant-light mb-1">{f.label}</label>
                        <input
                          type="number" min="0" max={f.max} step={f.step}
                          value={stats[f.key]}
                          onChange={(e) => updateStat(m.user_id, f.key, e.target.value)}
                          className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-1 text-white text-sm text-center"
                          required
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  if (!match) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={`Reportar Resultado — ${teamLabel(match.team1_id)} vs ${teamLabel(match.team2_id)}`}
    >
      {loadingTeams ? (
        <div className="text-center py-8 text-valorant-light">Cargando equipos...</div>
      ) : loadError ? (
        <div className="bg-red-500/20 border border-valorant-red p-3 text-red-400 text-sm">{loadError}</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-valorant-light italic">
            Marca los jugadores que participaron y completa sus stats. Reportar es irreversible:
            marca el match como <strong className="text-white">finished</strong> y suma los stats a los agregados de cada player.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {renderTeamSection(team1, team1Members, scoreTeam1, setScoreTeam1, 'border-valorant-red')}
            {renderTeamSection(team2, team2Members, scoreTeam2, setScoreTeam2, 'border-valorant-gold')}
          </div>

          {submitError && (
            <div className="bg-red-500/20 border border-valorant-red p-3 text-red-400 text-sm">{submitError}</div>
          )}

          <div className="flex justify-end pt-4 mt-6 border-t border-valorant-dark-tertiary gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-valorant-light hover:text-white font-bold uppercase">
              Cancelar
            </button>
            <button
              type="submit" disabled={submitting}
              className={`bg-valorant-red hover:bg-white hover:text-valorant-red transition-colors text-white px-6 py-2 pb-1 font-tungsten text-xl tracking-wider ${submitting ? 'opacity-50' : ''}`}
            >
              {submitting ? 'REPORTANDO...' : 'REPORTAR RESULTADO'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default AdminReportMatchModal;
