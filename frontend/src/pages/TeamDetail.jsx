import { useParams, Link, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { mockTeams, mockRequests } from '../data/mockData';
import Modal from '../components/Modal';

const TeamDetail = () => {
  const { id } = useParams();
  
  // Find the team
  const team = mockTeams.find(t => t.id === parseInt(id));

  // If team doesn't exist, we send them back to teams
  if (!team) {
    return <Navigate to="/teams" replace />;
  }

  const { user } = useAuth();
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyRole, setApplyRole] = useState('Duelist');
  const [applyAgent, setApplyAgent] = useState('');
  const [hasApplied, setHasApplied] = useState(
    user ? mockRequests.some(r => r.teamId === team.id && r.username === user.username && r.status === 'pending') : false
  );

  const isUserInAnyTeam = user ? mockTeams.some(t => t.leader === user.username || t.players.some(p => p.name === user.username)) : false;
  const isTeamFull = team.players && team.players.length >= 7;
  const isEligibleToApply = user && user.role !== 'admin' && !isUserInAnyTeam && !isTeamFull && !hasApplied;

  const handleApply = (e) => {
    e.preventDefault();
    mockRequests.push({
      id: Date.now(),
      teamId: team.id,
      username: user.username,
      role: applyRole,
      agent: applyAgent,
      status: 'pending'
    });
    setHasApplied(true);
    setIsApplyModalOpen(false);
  };

  const winRate = team.wins + team.losses > 0  
    ? ((team.wins / (team.wins + team.losses)) * 100).toFixed(0)
    : 0;

  const allMembers = team.players ? [...team.players] : [];
  const isLeaderInPlayers = allMembers.some(p => p.name === team.leader);
  if (team.leader && !isLeaderInPlayers) {
    allMembers.unshift({ 
      id: 'leader', 
      name: team.leader, 
      teamRole: 'coach', 
      isLeader: true, 
      role: 'Manager',
      stats: null
    });
  }

  return (
    <div className="min-h-screen bg-valorant-dark py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link to="/teams" className="text-valorant-light hover:text-white transition-colors text-sm uppercase font-bold tracking-wider">
            &larr; Volver a Equipos
          </Link>
        </div>

        {/* Hero Banner del Equipo */}
        <div className="bg-valorant-dark-secondary relative overflow-hidden clip-corner-sm mb-12 p-8 md:p-12 border-l-4 border-valorant-red">
          <div className="absolute right-0 top-0 opacity-10 text-[250px] font-tungsten leading-none select-none pointer-events-none transform translate-x-1/4 -translate-y-1/4 overflow-hidden">
            {team.logo && team.logo.startsWith('http') ? (
              <img src={team.logo} alt="" className="w-[400px] h-[400px] object-cover" />
            ) : (
              team.logo
            )}
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="w-32 h-32 md:w-48 md:h-48 bg-valorant-dark flex items-center justify-center text-6xl md:text-8xl shadow-2xl clip-corner overflow-hidden">
              {team.logo && team.logo.startsWith('http') ? (
                <img src={team.logo} alt="Team Logo" className="w-full h-full object-cover" />
              ) : (
                team.logo
              )}
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                <div className="inline-block bg-valorant-red text-white px-3 py-1 font-bold text-sm tracking-widest clip-corner-sm">
                  RANK #{team.rank}
                </div>
                {user && (
                  <div>
                    {hasApplied ? (
                      <span className="text-valorant-gold text-xs font-bold border border-valorant-gold px-3 py-1 bg-valorant-gold/10">SOLICITUD PENDIENTE</span>
                    ) : isTeamFull ? (
                      <span className="text-valorant-red text-xs font-bold border border-valorant-red px-3 py-1 bg-valorant-red/10">EQUIPO COMPLETO</span>
                    ) : isUserInAnyTeam ? (
                      <span className="text-valorant-light opacity-50 text-xs font-bold border border-valorant-dark px-3 py-1">YA TIENES EQUIPO</span>
                    ) : isEligibleToApply ? (
                      <button onClick={() => setIsApplyModalOpen(true)} className="bg-valorant-red hover:bg-white hover:text-valorant-red text-white font-bold px-4 py-1 pb-0.5 tracking-wider font-tungsten text-lg clip-corner-sm transition-colors">
                        SOLICITAR ENTRADA
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
              
              <h1 className="text-6xl md:text-8xl font-tungsten text-white tracking-wider mb-2 uppercase">
                {team.name}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-valorant-light text-sm uppercase font-bold tracking-wider mb-6">
                <span className="text-valorant-red">[{team.tag}]</span>
                <span>•</span>
                <span>{team.region}</span>
                {team.leader && (
                  <>
                    <span>•</span>
                    <span className="text-valorant-gold">Líder: {team.leader}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas Globales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="card-valorant p-6 text-center">
            <div className="text-4xl font-tungsten text-white mb-2">{team.players?.length || 0}</div>
            <div className="text-xs text-valorant-light uppercase tracking-wider">Jugadores Activos</div>
          </div>
          <div className="card-valorant p-6 text-center">
            <div className="text-4xl font-tungsten text-valorant-red mb-2">{team.wins}</div>
            <div className="text-xs text-valorant-light uppercase tracking-wider">Victorias Totales</div>
          </div>
          <div className="card-valorant p-6 text-center">
            <div className="text-4xl font-tungsten text-white mb-2">{team.losses}</div>
            <div className="text-xs text-valorant-light uppercase tracking-wider">Derrotas Totales</div>
          </div>
          <div className="card-valorant p-6 text-center">
            <div className="text-4xl font-tungsten text-valorant-gold mb-2">{winRate}%</div>
            <div className="text-xs text-valorant-light uppercase tracking-wider">Win Rate</div>
          </div>
        </div>

        {/* Jugadores (Plantilla) */}
        <div>
          <h2 className="text-4xl font-tungsten text-white tracking-wider mb-2">
            PLANTILLA ACTIVA
          </h2>
          <div className="h-1 w-24 bg-valorant-red mb-8"></div>
          
          {allMembers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allMembers.map((player) => {
                const isCoachOnly = player.teamRole === 'coach';
                const isBoth = player.teamRole === 'both';
                const roleText = isCoachOnly ? 'Coach' : isBoth ? 'Jug/Coach' : 'Jugador';
                const textColor = isCoachOnly ? 'text-valorant-gold' : isBoth ? 'text-blue-400' : 'text-white';
                const badgeColor = isCoachOnly ? 'border-valorant-gold text-valorant-gold' : isBoth ? 'border-blue-400 text-blue-400' : 'border-valorant-light opacity-50 text-valorant-light';

                return (
                <div key={player.id} className="card-valorant p-6 border-t-2 border-valorant-dark hover:border-valorant-red transition-colors group">
                  <div className="flex justify-between items-start mb-2">
                    <div className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase border ${badgeColor}`}>
                      {roleText}
                    </div>
                    {player.mainAgent && (
                      <div className="bg-valorant-dark-tertiary px-3 py-1 clip-corner-sm text-xs font-bold text-white uppercase opacity-80">
                        {player.mainAgent}
                      </div>
                    )}
                  </div>
                  <div className="mb-4">
                    <h3 className={`text-2xl font-tungsten uppercase tracking-wider group-hover:text-valorant-red transition-colors ${textColor}`}>
                      {player.name}
                    </h3>
                    {player.role && (
                      <p className="text-sm text-valorant-light font-bold">
                        {player.role}
                      </p>
                    )}
                  </div>
                  
                  {player.stats ? (
                    <>
                      <div className="divider-glow mb-4"></div>
                      <div className="grid grid-cols-4 gap-2 text-center text-xs">
                        <div>
                          <p className="text-valorant-light uppercase mb-1">K/D</p>
                          <p className="text-white font-bold">{player.stats.kd}</p>
                        </div>
                        <div>
                          <p className="text-valorant-light uppercase mb-1">ADR</p>
                          <p className="text-white font-bold">{player.stats.adr}</p>
                        </div>
                        <div>
                          <p className="text-valorant-light uppercase mb-1">HS%</p>
                          <p className="text-white font-bold">{player.stats.hs}</p>
                        </div>
                        <div>
                          <p className="text-valorant-light uppercase mb-1">Clutch</p>
                          <p className="text-white font-bold">{player.stats.clutches}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-valorant-light text-center h-12 flex items-center justify-center opacity-50">
                      Sin datos estadísticos
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-valorant-dark-tertiary border-2 border-dashed border-valorant-dark p-12 text-center clip-corner-sm">
              <h3 className="text-2xl font-tungsten text-valorant-light">SIN JUGADORES REGISTRADOS</h3>
            </div>
          )}
        </div>

        {/* Modal Apply */}
        <Modal isOpen={isApplyModalOpen} onClose={() => setIsApplyModalOpen(false)} title="Solicitar Unión al Equipo">
          <form onSubmit={handleApply} className="space-y-4">
            <p className="text-valorant-light text-sm mb-4">
              Envía tu perfil al líder del equipo <strong className="text-white">{team.name}</strong>. Si te acepta, entrarás a la plantilla activa automáticamente.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Tu Rol</label>
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
                <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Tu Agente Favorito</label>
                <input 
                  type="text" required value={applyAgent} onChange={(e) => setApplyAgent(e.target.value)}
                  placeholder="Ej: Jett, Omen..."
                  className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white"
                />
              </div>
            </div>
            <div className="flex justify-end pt-4 mt-6 border-t border-valorant-dark-tertiary gap-3">
              <button type="button" onClick={() => setIsApplyModalOpen(false)} className="px-4 py-2 text-valorant-light hover:text-white font-bold uppercase">
                Cancelar
              </button>
              <button type="submit" className="bg-valorant-red hover:bg-white hover:text-valorant-red transition-colors text-white px-6 py-2 pb-1 font-tungsten text-xl tracking-wider">
                ENVIAR SOLICITUD
              </button>
            </div>
          </form>
        </Modal>

      </div>
    </div>
  );
};

export default TeamDetail;
