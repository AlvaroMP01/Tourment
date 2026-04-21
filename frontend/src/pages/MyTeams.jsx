import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { mockTeams, mockRequests } from '../data/mockData';
import Modal from '../components/Modal';

const defaultTeam = {
  name: '',
  tag: '',
  region: 'España',
  logo: '🎮',
  players: []
};

const defaultPlayerInfo = {
  role: 'Duelist',
  mainAgent: 'Jett'
};

const MyTeams = () => {
  const { user } = useAuth();
  
  // We filter teams where the user is either the leader or a player
  const [myTeams, setMyTeams] = useState([]);
  const [requestsRefresh, setRequestsRefresh] = useState(0); // For forcing re-render when a request changes
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState(null);
  
  // Form state
  const [teamData, setTeamData] = useState({ ...defaultTeam });
  const [founderRole, setFounderRole] = useState('both'); // 'player', 'leader', 'both'
  const [playerInfo, setPlayerInfo] = useState({ ...defaultPlayerInfo });

  useEffect(() => {
    // Determine which teams belong to the user
    // In our mock data, we look for matches by user.username in players or in a mock 'leader' string.
    const userTeams = mockTeams.filter(t => 
      t.leader === user?.username || 
      t.players.some(p => p.name === user?.username)
    );
    setMyTeams(userTeams);
  }, [user]);

  const getPendingRequests = (teamId) => {
    return mockRequests.filter(r => r.teamId === teamId && r.status === 'pending');
  };

  const handleAcceptRequest = (reqId, teamId) => {
    const req = mockRequests.find(r => r.id === reqId);
    const team = mockTeams.find(t => t.id === teamId);
    if (!req || !team) return;

    if (team.players.length >= 7) {
      alert(`No se puede aceptar a ${req.username}. El equipo ya tiene el máximo de 7 jugadores.`);
      return;
    }

    // Add player to team
    team.players.push({
      id: Date.now(),
      name: req.username,
      role: req.role,
      mainAgent: req.agent,
      stats: { kills: 0, deaths: 0, assists: 0, kd: 0, adr: 0, hs: "0%", clutches: 0 },
      rank: 1,
      teamRole: 'player'
    });

    // Mark request as accepted
    req.status = 'accepted';
    
    // Update local state to reflect the new player count and remove the request from view
    setMyTeams([...mockTeams.filter(t => t.leader === user?.username || t.players.some(p => p.name === user?.username))]);
    setRequestsRefresh(r => r + 1);
  };

  const handleRejectRequest = (reqId) => {
    const req = mockRequests.find(r => r.id === reqId);
    if (req) {
      req.status = 'rejected';
      setRequestsRefresh(r => r + 1);
    }
  };

  const handleOpenCreateModal = () => {
    setIsEditMode(false);
    setEditingTeamId(null);
    setTeamData({ ...defaultTeam });
    setFounderRole('both');
    setPlayerInfo({ ...defaultPlayerInfo });
    setIsModalOpen(true);
  };

  const handleEditClick = (team) => {
    setIsEditMode(true);
    setEditingTeamId(team.id);
    setTeamData({
      name: team.name,
      tag: team.tag,
      region: team.region,
      logo: team.logo,
      leader: team.leader,
      players: [...(team.players || [])]
    });
    setIsModalOpen(true);
  };

  const handleRemovePlayer = (playerId) => {
    if (window.confirm('¿Seguro que quieres expulsar a este jugador del equipo?')) {
      setTeamData(prev => ({
        ...prev,
        players: prev.players.filter(p => p.id !== playerId)
      }));
    }
  };

  const handlePlayerTeamRoleChange = (playerId, newTeamRole) => {
    setTeamData(prev => ({
      ...prev,
      players: prev.players.map(p => p.id === playerId ? { ...p, teamRole: newTeamRole } : p)
    }));
  };

  const canEditTeam = (team) => {
    if (team.leader === user?.username) return true;
    const currentUserPlayer = team.players?.find(p => p.name === user?.username);
    return currentUserPlayer?.teamRole === 'coach' || currentUserPlayer?.teamRole === 'both';
  };

  const handleSaveTeam = (e) => {
    e.preventDefault();
    
    if (isEditMode && editingTeamId) {
      // Update existing team
      const updateTeamData = (team) => {
        if (team.id === editingTeamId) {
          return {
            ...team,
            name: teamData.name,
            tag: teamData.tag.toUpperCase(),
            region: teamData.region,
            logo: teamData.logo || '🎮',
            players: teamData.players
          };
        }
        return team;
      };

      // Update in mockTeams
      const mockIdx = mockTeams.findIndex(t => t.id === editingTeamId);
      if (mockIdx !== -1) {
        mockTeams[mockIdx] = updateTeamData(mockTeams[mockIdx]);
      }
      
      // Update in local state
      setMyTeams(prev => prev.map(updateTeamData));
      
    } else {
      // Create new team logic
      const newTeam = {
        id: Date.now(),
        name: teamData.name,
        tag: teamData.tag.toUpperCase(),
        region: teamData.region,
        logo: teamData.logo || '🎮',
        wins: 0,
        losses: 0,
        rank: mockTeams.length + 1,
        players: []
      };

      if (founderRole === 'leader' || founderRole === 'both') {
        newTeam.leader = user.username;
      }

      if (founderRole === 'player' || founderRole === 'both') {
        newTeam.players.push({
          id: Date.now() + 1,
          name: user.username,
          role: playerInfo.role,
          mainAgent: playerInfo.mainAgent,
          stats: { kills: 0, deaths: 0, assists: 0, kd: 0, adr: 0, hs: "0%", clutches: 0 },
          rank: 1
        });
      }

      mockTeams.push(newTeam); // Persist in memory to show globally
      setMyTeams(prev => [...prev, newTeam]); // Show in personal list
    }
    
    // Reset and close
    setTeamData({ ...defaultTeam });
    setPlayerInfo({ ...defaultPlayerInfo });
    setFounderRole('both');
    setIsEditMode(false);
    setEditingTeamId(null);
    setIsModalOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (['role', 'mainAgent'].includes(name)) {
      setPlayerInfo(prev => ({ ...prev, [name]: value }));
    } else {
      setTeamData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="min-h-screen bg-valorant-dark py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-6xl font-tungsten text-white tracking-wider mb-2">
              MIS EQUIPOS
            </h1>
            <div className="h-1 w-32 bg-valorant-red mb-4"></div>
            <p className="text-valorant-light text-lg">
              Gestiona los equipos a los que perteneces o funda uno nuevo.
            </p>
          </div>
          <button onClick={handleOpenCreateModal} className="btn-valorant">
            + Fundar Equipo
          </button>
        </div>

        {myTeams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myTeams.map(team => (
              <div key={team.id} className="card-valorant p-6 flex flex-col items-center group cursor-pointer hover:border-valorant-red transition-colors relative">
                
                {/* Botón de editar para líderes o coaches */}
                {canEditTeam(team) && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleEditClick(team); }}
                    className="absolute top-4 right-4 text-valorant-light hover:text-white bg-valorant-dark-tertiary px-3 py-1 text-xs font-bold uppercase hover:bg-valorant-red transition-colors clip-corner-sm"
                    title="Editar Equipo"
                  >
                    Editar
                  </button>
                )}

                <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform w-20 h-20 flex items-center justify-center">
                  {team.logo && team.logo.startsWith('http') ? (
                    <img src={team.logo} alt="Logo" className="w-full h-full object-cover clip-corner-sm" />
                  ) : (
                    team.logo
                  )}
                </div>
                <h3 className="text-2xl font-tungsten tracking-wider text-white mb-1 uppercase text-center">{team.name}</h3>
                <span className="text-valorant-red font-bold text-sm mb-4">[{team.tag}]</span>
                
                <div className="w-full bg-valorant-dark-secondary p-4 mt-2 clip-corner-sm">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-valorant-light uppercase">Tu Rol</span>
                    <span className="text-white font-bold">
                      {team.leader === user?.username && team.players.some(p => p.name === user?.username) ? 'Líder / Jugador' :
                       team.leader === user?.username ? 'Mánager' : 'Jugador'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-valorant-light uppercase">Región</span>
                    <span className="text-white font-bold">{team.region}</span>
                  </div>
                  <div className="flex justify-between text-xs mt-2">
                    <span className="text-valorant-light uppercase">Jugadores</span>
                    <span className="text-white font-bold">{team.players?.length || 0} / 7</span>
                  </div>
                </div>

                {/* Bandeja de Solicitudes (Solo si el usuario es LÍDER) */}
                {team.leader === user?.username && (
                  <div className="w-full mt-4 flex border-t border-valorant-dark pt-4 flex-col gap-2 cursor-default">
                    <h4 className="text-xs text-valorant-light uppercase font-bold text-center">Bandeja de Reclutamiento</h4>
                    {getPendingRequests(team.id).length > 0 ? (
                      getPendingRequests(team.id).map(req => (
                        <div key={req.id} className="bg-valorant-dark p-3 text-xs border border-valorant-dark-tertiary">
                          <div className="flex justify-between mb-2">
                            <span className="font-bold text-white">{req.username}</span>
                            <span className="text-valorant-light">{req.role} ({req.agent})</span>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={(e) => { e.stopPropagation(); handleAcceptRequest(req.id, team.id); }} className="flex-1 bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white font-bold uppercase transition-colors py-1">
                              Aceptar
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleRejectRequest(req.id); }} className="flex-1 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white font-bold uppercase transition-colors py-1">
                              Rechazar
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-xs text-valorant-light opacity-50 italic py-2">
                        No hay solicitudes pendientes.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-valorant-dark-tertiary border-2 border-dashed border-valorant-dark p-12 text-center rounded">
            <h2 className="text-2xl font-tungsten text-valorant-light mb-4">AÚN NO TIENES NINGÚN EQUIPO</h2>
            <p className="text-gray-400 mb-6">Comienza tu leyenda fundando tu propio equipo y recrutandos jugadores.</p>
            <button onClick={handleOpenCreateModal} className="btn-valorant">
              Fundar Equipo
            </button>
          </div>
        )}

      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={isEditMode ? "Editar Equipo" : "Fundar Nuevo Equipo"}
      >
        <form onSubmit={handleSaveTeam} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1 md:col-span-2 flex gap-4">
              <div className="w-full md:w-32">
                <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Logo (URL o Emoji)</label>
                <input 
                  type="text" name="logo" required value={teamData.logo} onChange={handleChange}
                  className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white text-center text-xl"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Nombre del Equipo</label>
                <input 
                  type="text" name="name" required value={teamData.name} onChange={handleChange}
                  className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-valorant-light mb-1">TAG (Ej: FNC)</label>
              <input 
                type="text" name="tag" required value={teamData.tag} onChange={handleChange} maxLength={4}
                className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Región</label>
              <input 
                type="text" name="region" required value={teamData.region} onChange={handleChange}
                className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white"
              />
            </div>
          </div>

          {!isEditMode && (
            <>
              <div className="bg-valorant-dark-tertiary p-4 rounded border-l-4 border-valorant-red">
                <label className="block text-sm font-bold uppercase text-white mb-3">
                  ¿Cuál será tu puesto en el equipo?
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button 
                    type="button"
                    onClick={() => setFounderRole('player')}
                    className={`p-3 text-sm text-center border transition-all ${founderRole === 'player' ? 'bg-valorant-red border-valorant-red text-white font-bold' : 'border-valorant-dark text-valorant-light hover:border-valorant-light'}`}
                  >
                    Solo Jugador
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFounderRole('leader')}
                    className={`p-3 text-sm text-center border transition-all ${founderRole === 'leader' ? 'bg-valorant-red border-valorant-red text-white font-bold' : 'border-valorant-dark text-valorant-light hover:border-valorant-light'}`}
                  >
                    Mánager / Líder
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFounderRole('both')}
                    className={`p-3 text-sm text-center border transition-all ${founderRole === 'both' ? 'bg-valorant-red border-valorant-red text-white font-bold' : 'border-valorant-dark text-valorant-light hover:border-valorant-light'}`}
                  >
                    Jugador y Líder
                  </button>
                </div>
              </div>

              {(founderRole === 'player' || founderRole === 'both') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-valorant-dark-secondary p-4 animate-fade-in">
                  <div>
                    <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Tu Rol Principal</label>
                    <select 
                      name="role" value={playerInfo.role} onChange={handleChange}
                      className="w-full bg-valorant-dark border border-valorant-dark outline-none p-2 text-white focus:border-valorant-red"
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
                      type="text" name="mainAgent" required value={playerInfo.mainAgent} onChange={handleChange}
                      placeholder="Ej: Reyna, Jett..."
                      className="w-full bg-valorant-dark border border-valorant-dark outline-none p-2 text-white focus:border-valorant-red"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {isEditMode && (
            <div className="bg-valorant-dark-tertiary p-4 rounded border-t-2 border-valorant-red">
              <h4 className="text-sm font-bold uppercase text-white mb-3">Gestión de Plantilla</h4>
              {teamData.players.length > 0 ? (
                <div className="space-y-2">
                  {teamData.players.map(p => (
                    <div key={p.id} className="flex justify-between items-center bg-valorant-dark p-2 border border-valorant-dark-secondary">
                      <div className="flex flex-col">
                        <span className="font-bold text-white text-sm">
                          {p.name} {teamData.leader === p.name ? <span className="text-valorant-gold text-xs ml-1">(Líder)</span> : null}
                        </span>
                        <span className="text-xs text-valorant-light">{p.role} ({p.mainAgent})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {teamData.leader !== p.name && (
                          <>
                            <select
                              value={p.teamRole || 'player'}
                              onChange={(e) => handlePlayerTeamRoleChange(p.id, e.target.value)}
                              className="bg-valorant-dark border border-valorant-red/30 text-white p-1 text-xs font-bold uppercase focus:border-valorant-red focus:outline-none"
                            >
                              <option value="player">Jugador</option>
                              <option value="coach">Solo Coach</option>
                              <option value="both">Jugador y Coach</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => handleRemovePlayer(p.id)}
                              className="text-valorant-red hover:text-white font-bold px-2 py-1 bg-valorant-dark-secondary hover:bg-valorant-red/20 transition-colors text-xs border border-transparent hover:border-valorant-red"
                              title="Expulsar jugador"
                            >
                              X
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-xs text-valorant-light italic py-2">
                  No hay jugadores en la plantilla.
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-4 mt-6 border-t border-valorant-dark-tertiary gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-valorant-light hover:text-white font-bold uppercase">
              Cancelar
            </button>
            <button type="submit" className="bg-valorant-red hover:bg-white hover:text-valorant-red transition-colors text-white px-6 py-2 pb-1 font-tungsten text-xl tracking-wider clip-corner-sm">
              {isEditMode ? 'GUARDAR CAMBIOS' : 'CREAR EQUIPO'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MyTeams;
