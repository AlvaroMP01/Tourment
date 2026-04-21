import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mockTeams, mockMatches, mockTournaments, mockPlayers } from '../data/mockData';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Load profile from localStorage
  const loadProfile = () => {
    const saved = localStorage.getItem(`profileData_${user?.username}`);
    if (saved) return JSON.parse(saved);
    return { displayName: user?.username || '', avatar: '🎮', bio: '', stats: null };
  };

  const [profile, setProfile] = useState(loadProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ ...profile });

  useEffect(() => {
    if (user) setProfile(loadProfile());
  }, [user]);

  const saveProfile = () => {
    const updated = { ...profile, displayName: editForm.displayName, avatar: editForm.avatar, bio: editForm.bio };
    if (editForm.stats) updated.stats = editForm.stats;
    setProfile(updated);
    localStorage.setItem(`profileData_${user.username}`, JSON.stringify(updated));
    setIsEditing(false);
  };

  // Find player data from mockPlayers
  const playerData = mockPlayers.find(p => p.name === user?.username || p.name === profile.displayName);
  const stats = profile.stats || playerData?.stats || { kills: 0, deaths: 0, assists: 0, kd: 0, adr: 0, hs: '0%', clutches: 0 };

  // Find user's teams
  const userTeams = mockTeams.filter(t =>
    t.leader === user?.username || t.players?.some(p => p.name === user?.username)
  );

  // Find user's matches
  const userTeamIds = userTeams.map(t => t.id);
  const userMatches = mockMatches.filter(m =>
    userTeamIds.includes(m.team1?.id) || userTeamIds.includes(m.team2?.id)
  );

  // Find user's tournaments
  const userTournamentIds = [...new Set(userMatches.map(m => m.tournamentId))];
  const userTournaments = mockTournaments.filter(t => userTournamentIds.includes(t.id));

  // Badges
  const badges = [];
  if (userTeams.length > 0) badges.push({ icon: '🛡️', label: 'Tiene Equipo' });
  if (userTeams.some(t => t.leader === user?.username)) badges.push({ icon: '👑', label: 'Líder' });
  if (userTournaments.length > 0) badges.push({ icon: '🏆', label: 'Competidor' });
  if (stats.kills >= 100) badges.push({ icon: '💀', label: '100+ Kills' });
  if (stats.clutches >= 10) badges.push({ icon: '🔥', label: 'Clutch Master' });

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      logout();
      navigate('/');
    }
  };

  const statusLabel = (s) => {
    if (s === 'live') return { text: 'EN VIVO', cls: 'bg-green-500' };
    if (s === 'upcoming') return { text: 'PRÓXIMO', cls: 'bg-valorant-gold' };
    return { text: 'FINALIZADO', cls: 'bg-valorant-light/30' };
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-valorant-dark py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* HERO */}
        <div className="bg-valorant-dark-secondary border-l-4 border-valorant-red p-8 md:p-12 mb-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-5 text-[200px] font-tungsten leading-none select-none pointer-events-none translate-x-1/4 -translate-y-1/4">
            {profile.avatar}
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            {/* Avatar */}
            <div className="w-32 h-32 bg-valorant-dark flex items-center justify-center text-6xl shadow-2xl clip-corner overflow-hidden shrink-0">
              {isEditing ? (
                <input
                  type="text" maxLength={2} value={editForm.avatar}
                  onChange={e => setEditForm({ ...editForm, avatar: e.target.value })}
                  className="w-full h-full bg-transparent text-center text-5xl outline-none"
                />
              ) : (
                profile.avatar
              )}
            </div>

            <div className="flex-1 text-center md:text-left w-full">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Nombre de Jugador</label>
                    <input
                      type="text" value={editForm.displayName}
                      onChange={e => setEditForm({ ...editForm, displayName: e.target.value })}
                      className="w-full bg-valorant-dark border border-valorant-dark-tertiary p-2 text-white text-2xl font-tungsten tracking-wider outline-none focus:border-valorant-red"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Descripción</label>
                    <textarea
                      value={editForm.bio} rows={3}
                      onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                      placeholder="Cuéntanos sobre ti como jugador..."
                      className="w-full bg-valorant-dark border border-valorant-dark-tertiary p-2 text-white text-sm outline-none focus:border-valorant-red resize-none"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-5xl md:text-7xl font-tungsten text-white tracking-wider uppercase">
                    {profile.displayName}
                  </h1>
                  <p className="text-valorant-light text-sm mt-2 max-w-lg">
                    {profile.bio || 'Sin descripción aún. ¡Edita tu perfil para añadir una!'}
                  </p>
                  <div className="text-xs text-valorant-light/50 mt-2 uppercase">
                    @{user.username} · Rol: {user.role}
                  </div>
                </>
              )}

              <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                {isEditing ? (
                  <>
                    <button onClick={saveProfile} className="bg-valorant-red hover:bg-white hover:text-valorant-red text-white px-4 py-2 font-bold uppercase text-xs tracking-wider transition-colors clip-corner-sm">
                      Guardar
                    </button>
                    <button onClick={() => { setIsEditing(false); setEditForm({ ...profile }); }} className="text-valorant-light hover:text-white px-4 py-2 font-bold uppercase text-xs tracking-wider">
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button onClick={() => { setEditForm({ ...profile, stats: { ...stats } }); setIsEditing(true); }} className="bg-valorant-dark-tertiary hover:bg-valorant-red text-white px-4 py-2 font-bold uppercase text-xs tracking-wider transition-colors clip-corner-sm">
                    Editar Perfil
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BADGES */}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-8">
            {badges.map((b, i) => (
              <div key={i} className="bg-valorant-dark-secondary border border-valorant-dark-tertiary px-4 py-2 flex items-center gap-2 clip-corner-sm">
                <span className="text-lg">{b.icon}</span>
                <span className="text-xs font-bold uppercase text-valorant-light">{b.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* STATS */}
        <div className="mb-12">
          <h2 className="text-4xl font-tungsten text-white tracking-wider mb-2">ESTADÍSTICAS</h2>
          <div className="h-1 w-24 bg-valorant-red mb-6"></div>

          {isEditing ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['kills', 'deaths', 'assists', 'adr', 'clutches'].map(key => (
                <div key={key} className="card-valorant p-4 text-center">
                  <label className="block text-xs text-valorant-light uppercase mb-1">{key}</label>
                  <input
                    type="number" value={editForm.stats?.[key] || 0}
                    onChange={e => setEditForm({ ...editForm, stats: { ...editForm.stats, [key]: Number(e.target.value) } })}
                    className="w-full bg-valorant-dark text-center text-2xl font-tungsten text-white border border-valorant-dark-tertiary outline-none focus:border-valorant-red p-1"
                  />
                </div>
              ))}
              <div className="card-valorant p-4 text-center">
                <label className="block text-xs text-valorant-light uppercase mb-1">HS%</label>
                <input
                  type="text" value={editForm.stats?.hs || '0%'}
                  onChange={e => setEditForm({ ...editForm, stats: { ...editForm.stats, hs: e.target.value } })}
                  className="w-full bg-valorant-dark text-center text-2xl font-tungsten text-white border border-valorant-dark-tertiary outline-none focus:border-valorant-red p-1"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card-valorant p-6 text-center">
                <div className="text-3xl font-tungsten text-valorant-red">{stats.kills}</div>
                <div className="text-xs text-valorant-light uppercase">Kills</div>
              </div>
              <div className="card-valorant p-6 text-center">
                <div className="text-3xl font-tungsten text-white">{stats.deaths}</div>
                <div className="text-xs text-valorant-light uppercase">Deaths</div>
              </div>
              <div className="card-valorant p-6 text-center">
                <div className="text-3xl font-tungsten text-blue-400">{stats.assists}</div>
                <div className="text-xs text-valorant-light uppercase">Assists</div>
              </div>
              <div className="card-valorant p-6 text-center">
                <div className="text-3xl font-tungsten text-valorant-gold">{stats.kd || (stats.deaths > 0 ? (stats.kills / stats.deaths).toFixed(2) : '0.00')}</div>
                <div className="text-xs text-valorant-light uppercase">K/D</div>
              </div>
              <div className="card-valorant p-6 text-center">
                <div className="text-3xl font-tungsten text-white">{stats.adr}</div>
                <div className="text-xs text-valorant-light uppercase">ADR</div>
              </div>
              <div className="card-valorant p-6 text-center">
                <div className="text-3xl font-tungsten text-valorant-red">{stats.hs}</div>
                <div className="text-xs text-valorant-light uppercase">HS%</div>
              </div>
              <div className="card-valorant p-6 text-center">
                <div className="text-3xl font-tungsten text-valorant-gold">{stats.clutches}</div>
                <div className="text-xs text-valorant-light uppercase">Clutches</div>
              </div>
            </div>
          )}
        </div>

        {/* MIS EQUIPOS */}
        <div className="mb-12">
          <h2 className="text-4xl font-tungsten text-white tracking-wider mb-2">MIS EQUIPOS</h2>
          <div className="h-1 w-24 bg-valorant-red mb-6"></div>
          {userTeams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userTeams.map(team => {
                const playerInTeam = team.players?.find(p => p.name === user.username);
                const isLeader = team.leader === user.username;
                const teamRole = isLeader ? 'Líder' : playerInTeam?.teamRole === 'coach' ? 'Coach' : playerInTeam?.teamRole === 'both' ? 'Jugador/Coach' : 'Jugador';
                return (
                  <Link key={team.id} to={`/teams/${team.id}`} className="card-valorant p-5 flex items-center gap-4 hover:border-valorant-red transition-colors group">
                    <div className="w-14 h-14 bg-valorant-dark-tertiary clip-corner flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                      {team.logo && team.logo.startsWith('http') ? <img src={team.logo} alt="" className="w-full h-full object-cover" /> : team.logo}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-tungsten text-white tracking-wider group-hover:text-valorant-red transition-colors truncate">{team.name}</h3>
                      <span className="text-xs text-valorant-light">[{team.tag}] · {team.region}</span>
                    </div>
                    <div className={`text-[10px] font-bold uppercase px-2 py-1 border shrink-0 ${isLeader ? 'border-valorant-gold text-valorant-gold' : 'border-valorant-light text-valorant-light'}`}>
                      {teamRole}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="card-valorant p-8 text-center">
              <p className="text-valorant-light text-sm">No estás en ningún equipo todavía.</p>
              <Link to="/teams" className="text-valorant-red text-xs font-bold uppercase mt-2 inline-block hover:text-white transition-colors">Explorar Equipos →</Link>
            </div>
          )}
        </div>

        {/* TORNEOS */}
        <div className="mb-12">
          <h2 className="text-4xl font-tungsten text-white tracking-wider mb-2">TORNEOS</h2>
          <div className="h-1 w-24 bg-valorant-red mb-6"></div>
          {userTournaments.length > 0 ? (
            <div className="space-y-3">
              {userTournaments.map(t => {
                const st = statusLabel(t.status);
                return (
                  <Link key={t.id} to={`/tournaments/${t.id}`} className="card-valorant p-4 flex items-center justify-between hover:border-valorant-red transition-colors group block">
                    <div className="flex items-center gap-4">
                      <span className={`px-2 py-0.5 text-[10px] font-bold text-white uppercase ${st.cls}`}>{st.text}</span>
                      <h3 className="text-lg font-tungsten text-white tracking-wider group-hover:text-valorant-red transition-colors">{t.name}</h3>
                    </div>
                    <span className="text-xs text-valorant-light">{t.prize}</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="card-valorant p-8 text-center">
              <p className="text-valorant-light text-sm">Aún no has participado en ningún torneo.</p>
              <Link to="/tournaments" className="text-valorant-red text-xs font-bold uppercase mt-2 inline-block hover:text-white transition-colors">Ver Torneos →</Link>
            </div>
          )}
        </div>

        {/* PARTIDAS */}
        <div className="mb-12">
          <h2 className="text-4xl font-tungsten text-white tracking-wider mb-2">HISTORIAL DE PARTIDAS</h2>
          <div className="h-1 w-24 bg-valorant-red mb-6"></div>
          {userMatches.length > 0 ? (
            <div className="space-y-3">
              {userMatches.map(m => {
                const userTeam = userTeamIds.includes(m.team1?.id) ? m.team1 : m.team2;
                const opponent = userTeam === m.team1 ? m.team2 : m.team1;
                const userScore = userTeam === m.team1 ? m.score1 : m.score2;
                const oppScore = userTeam === m.team1 ? m.score2 : m.score1;
                const won = userScore > oppScore;
                const isLive = m.status === 'live';
                return (
                  <div key={m.id} className="card-valorant p-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-8 shrink-0 ${isLive ? 'bg-green-500 animate-pulse' : won ? 'bg-valorant-red' : 'bg-valorant-light/30'}`}></span>
                      <div>
                        <span className="text-white font-bold text-sm">{userTeam?.name}</span>
                        <span className="text-valorant-light mx-2 text-xs">vs</span>
                        <span className="text-white font-bold text-sm">{opponent?.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-valorant-light uppercase">{m.map}</span>
                      <span className="text-valorant-light">·</span>
                      <span className="text-valorant-light uppercase">{m.round}</span>
                      <span className={`font-tungsten text-2xl ${isLive ? 'text-green-400' : won ? 'text-valorant-red' : 'text-valorant-light'}`}>
                        {userScore} - {oppScore}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card-valorant p-8 text-center">
              <p className="text-valorant-light text-sm">No hay partidas registradas.</p>
            </div>
          )}
        </div>

        {/* CERRAR SESIÓN */}
        <div className="border-t-2 border-valorant-dark-tertiary pt-8">
          <button
            onClick={handleLogout}
            className="w-full bg-valorant-dark-secondary border-2 border-valorant-red/30 hover:border-valorant-red hover:bg-valorant-red/10 text-valorant-red font-bold uppercase text-sm tracking-wider py-4 transition-all clip-corner-sm"
          >
            Cerrar Sesión
          </button>
        </div>

      </div>
    </div>
  );
};

export default Profile;
