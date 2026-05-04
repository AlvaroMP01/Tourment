import { useParams, Link, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { routesAPI } from '../services/routesAPI';
import Modal from '../components/Modal';
import TeamLogo from '../components/TeamLogo';

const ROLE_LABELS = {
  manager: 'Manager',
  player: 'Jugador',
  coach: 'Coach',
  player_coach: 'Jugador / Coach',
};

const TeamDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyRole, setApplyRole] = useState('Duelist');
  const [applyAgent, setApplyAgent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await routesAPI.getTeamDetail(id);
        setTeam(data);
      } catch (err) {
        if (err.message?.includes('404') || /no encontrad/i.test(err.message || '')) {
          setNotFound(true);
        } else {
          setError(err.message || 'No se pudo cargar el equipo');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (notFound) return <Navigate to="/teams" replace />;
  if (loading) {
    return (
      <div className="min-h-screen bg-valorant-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-valorant-red"></div>
      </div>
    );
  }
  if (!team) {
    return (
      <div className="min-h-screen bg-valorant-dark flex items-center justify-center text-center">
        <div>
          <h2 className="text-3xl font-tungsten text-valorant-red mb-4">Error</h2>
          <p className="text-valorant-light">{error}</p>
          <Link to="/teams" className="btn-valorant mt-4 inline-block">Volver</Link>
        </div>
      </div>
    );
  }

  const isUserMember = user && team.members.some(m => m.user_id === user.id);
  const isTeamFull = team.occupied_slots >= team.max_slots;
  // Solo el rol global 'player' puede solicitar unirse (regla del backend)
  const canRequestJoin = user && user.role === 'player' && !isUserMember && !isTeamFull && !applySuccess;
  const founderMember = team.members.find(m => m.is_founder);

  const handleApply = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await routesAPI.requestToJoin(team.id, {
        ingame_role: applyRole,
        favorite_agent: applyAgent,
      });
      setApplySuccess(true);
      setIsApplyModalOpen(false);
    } catch (err) {
      setError(err.message || 'No se pudo enviar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-valorant-dark py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link to="/teams" className="text-valorant-light hover:text-white transition-colors text-sm uppercase font-bold tracking-wider">
            &larr; Volver a Equipos
          </Link>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-valorant-red p-3 mb-4 text-sm text-center text-red-400">
            {error}
          </div>
        )}
        {applySuccess && (
          <div className="bg-green-500/20 border border-green-500 p-3 mb-4 text-sm text-center text-green-400 font-bold">
            Solicitud enviada. El fundador del equipo decidirá.
          </div>
        )}

        <div className="bg-valorant-dark-secondary relative overflow-hidden clip-corner-sm mb-12 p-8 md:p-12 border-l-4 border-valorant-red">
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="shadow-2xl">
              <TeamLogo path={team.logo} size="xl" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                {user && (
                  <div>
                    {isUserMember ? (
                      <span className="text-green-400 text-xs font-bold border border-green-500 px-3 py-1 bg-green-500/10">YA PERTENECES A ESTE EQUIPO</span>
                    ) : isTeamFull ? (
                      <span className="text-valorant-red text-xs font-bold border border-valorant-red px-3 py-1 bg-valorant-red/10">EQUIPO COMPLETO</span>
                    ) : applySuccess ? (
                      <span className="text-valorant-gold text-xs font-bold border border-valorant-gold px-3 py-1 bg-valorant-gold/10">SOLICITUD ENVIADA</span>
                    ) : canRequestJoin ? (
                      <button onClick={() => setIsApplyModalOpen(true)} className="bg-valorant-red hover:bg-white hover:text-valorant-red text-white font-bold px-4 py-1 pb-0.5 tracking-wider font-tungsten text-lg clip-corner-sm transition-colors">
                        SOLICITAR ENTRADA
                      </button>
                    ) : user.role !== 'player' ? (
                      <span className="text-valorant-light opacity-60 text-xs font-bold border border-valorant-dark px-3 py-1">
                        Solo Players pueden solicitar
                      </span>
                    ) : null}
                  </div>
                )}
              </div>

              <h1 className="text-6xl md:text-8xl font-tungsten text-white tracking-wider mb-2 uppercase">
                {team.name}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-valorant-light text-sm uppercase font-bold tracking-wider mb-6">
                <span className="text-valorant-red">[{team.tag}]</span>
                {team.region && <><span>•</span><span>{team.region}</span></>}
                {founderMember && (
                  <>
                    <span>•</span>
                    <span className="text-valorant-gold">Founder: {founderMember.nickname}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
          <div className="card-valorant p-6 text-center">
            <div className="text-4xl font-tungsten text-white mb-2">{team.members.length}</div>
            <div className="text-xs text-valorant-light uppercase tracking-wider">Miembros Totales</div>
          </div>
          <div className="card-valorant p-6 text-center">
            <div className="text-4xl font-tungsten text-valorant-red mb-2">{team.occupied_slots}</div>
            <div className="text-xs text-valorant-light uppercase tracking-wider">Plazas Ocupadas</div>
          </div>
          <div className="card-valorant p-6 text-center">
            <div className="text-4xl font-tungsten text-valorant-gold mb-2">{Math.max(0, team.max_slots - team.occupied_slots)}</div>
            <div className="text-xs text-valorant-light uppercase tracking-wider">Plazas Libres</div>
          </div>
        </div>

        <div>
          <h2 className="text-4xl font-tungsten text-white tracking-wider mb-2">PLANTILLA</h2>
          <div className="h-1 w-24 bg-valorant-red mb-8"></div>

          {team.members.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {team.members.map((m) => (
                <div key={m.user_id} className="card-valorant p-6 border-t-2 border-valorant-dark hover:border-valorant-red transition-colors group">
                  <div className="flex justify-between items-start mb-2">
                    <div className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase border border-valorant-light text-valorant-light">
                      {ROLE_LABELS[m.role] || m.role}
                    </div>
                    {m.is_founder && (
                      <div className="bg-valorant-gold/20 border border-valorant-gold px-2 py-0.5 text-[10px] font-bold uppercase text-valorant-gold">
                        Founder
                      </div>
                    )}
                  </div>
                  <div className="mb-2">
                    <h3 className="text-2xl font-tungsten uppercase tracking-wider text-white group-hover:text-valorant-red transition-colors">
                      {m.nickname}
                    </h3>
                    {m.ingame_role && (
                      <p className="text-sm text-valorant-light font-bold">
                        {m.ingame_role}{m.favorite_agent ? ` · ${m.favorite_agent}` : ''}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-valorant-light opacity-60">
                    {m.occupies_slot ? 'Ocupa plaza' : 'No ocupa plaza'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-valorant-dark-tertiary border-2 border-dashed border-valorant-dark p-12 text-center clip-corner-sm">
              <h3 className="text-2xl font-tungsten text-valorant-light">SIN MIEMBROS</h3>
            </div>
          )}
        </div>

        <Modal isOpen={isApplyModalOpen} onClose={() => setIsApplyModalOpen(false)} title="Solicitar Unión al Equipo">
          <form onSubmit={handleApply} className="space-y-4">
            <p className="text-valorant-light text-sm mb-4">
              Envía tu solicitud al fundador del equipo <strong className="text-white">{team.name}</strong>.
              Si te acepta, entrarás a la plantilla automáticamente.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Rol Principal</label>
                <select
                  value={applyRole} onChange={(e) => setApplyRole(e.target.value)} required
                  className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white"
                >
                  <option value="Duelist">Duelist</option>
                  <option value="Initiator">Initiator</option>
                  <option value="Controller">Controller</option>
                  <option value="Sentinel">Sentinel</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Agente Favorito</label>
                <input
                  type="text" required value={applyAgent} onChange={(e) => setApplyAgent(e.target.value)}
                  placeholder="Jett, Omen..."
                  className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white"
                />
              </div>
            </div>
            <div className="flex justify-end pt-4 mt-6 border-t border-valorant-dark-tertiary gap-3">
              <button type="button" onClick={() => setIsApplyModalOpen(false)} className="px-4 py-2 text-valorant-light hover:text-white font-bold uppercase">
                Cancelar
              </button>
              <button
                type="submit" disabled={submitting}
                className={`bg-valorant-red hover:bg-white hover:text-valorant-red transition-colors text-white px-6 py-2 pb-1 font-tungsten text-xl tracking-wider ${submitting ? 'opacity-50' : ''}`}
              >
                {submitting ? 'ENVIANDO...' : 'ENVIAR SOLICITUD'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default TeamDetail;
