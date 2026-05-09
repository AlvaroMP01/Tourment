import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { routesAPI } from '../services/routesAPI';
import Modal from '../components/Modal';
import TeamLogo from '../components/TeamLogo';
import ImageUploader from '../components/ImageUploader';

const ROLE_LABELS = {
  manager: 'Manager',
  player: 'Jugador',
  coach: 'Coach',
  player_coach: 'Jugador / Coach',
};

const ANDALUCIA_PROVINCES = [
  'Almería',
  'Cádiz',
  'Córdoba',
  'Granada',
  'Huelva',
  'Jaén',
  'Málaga',
  'Sevilla',
];

const emptyTeamForm = {
  name: '',
  tag: '',
  region: '',
};

const MyTeams = () => {
  const { user } = useAuth();

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [editingTeamLogo, setEditingTeamLogo] = useState(null);
  const [teamForm, setTeamForm] = useState(emptyTeamForm);
  const [submitting, setSubmitting] = useState(false);

  const flashSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const myTeams = await routesAPI.getMyTeams();
      const enriched = await Promise.all(myTeams.map(async (t) => {
        const detail = await routesAPI.getTeamDetail(t.id);
        const iAmFounder = detail.founder_user_id === user?.id;
        let joinRequests = null;
        if (iAmFounder) {
          try {
            joinRequests = await routesAPI.listJoinRequests(t.id, 'pending');
          } catch {
            joinRequests = [];
          }
        }
        return { ...detail, iAmFounder, joinRequests };
      }));
      setTeams(enriched);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar tus equipos');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const canCreateTeam =
    user && ['coach', 'player_coach'].includes(user.role) && teams.length === 0;

  const openCreateForm = () => {
    setEditingTeamId(null);
    setEditingTeamLogo(null);
    setTeamForm(emptyTeamForm);
    setIsFormOpen(true);
  };

  const openEditForm = (team) => {
    setEditingTeamId(team.id);
    setEditingTeamLogo(team.logo || null);
    setTeamForm({
      name: team.name,
      tag: team.tag,
      region: team.region || '',
    });
    setIsFormOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setTeamForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveTeam = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (editingTeamId) {
        await routesAPI.updateTeam(editingTeamId, teamForm);
        flashSuccess('Equipo actualizado');
      } else {
        await routesAPI.createTeam(teamForm);
        flashSuccess('Equipo creado');
      }
      setIsFormOpen(false);
      await loadAll();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el equipo');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDissolveTeam = async (team) => {
    const msg = `¿Disolver el equipo "${team.name}"?\n\nTodos los miembros saldrán y los matches relacionados se borrarán por cascada. Acción irreversible.`;
    if (!window.confirm(msg)) return;
    try {
      await routesAPI.deleteTeam(team.id);
      flashSuccess(`Equipo "${team.name}" disuelto`);
      await loadAll();
    } catch (err) {
      setError(err.message || 'No se pudo disolver el equipo');
    }
  };

  const handleAccept = async (team, req) => {
    try {
      await routesAPI.acceptJoinRequest(team.id, req.id);
      flashSuccess(`${req.nickname} aceptado en el equipo`);
      await loadAll();
    } catch (err) {
      setError(err.message || 'No se pudo aceptar');
    }
  };

  const handleReject = async (team, req) => {
    if (!window.confirm(`¿Rechazar la solicitud de ${req.nickname}?`)) return;
    try {
      await routesAPI.rejectJoinRequest(team.id, req.id);
      flashSuccess(`Solicitud de ${req.nickname} rechazada`);
      await loadAll();
    } catch (err) {
      setError(err.message || 'No se pudo rechazar');
    }
  };

  const handleKick = async (team, member) => {
    if (!window.confirm(`¿Expulsar a ${member.nickname} del equipo?`)) return;
    try {
      await routesAPI.removeTeamMember(team.id, member.user_id);
      flashSuccess(`${member.nickname} expulsado`);
      await loadAll();
    } catch (err) {
      setError(err.message || 'No se pudo expulsar');
    }
  };

  const handleLeave = async (team) => {
    if (!window.confirm(`¿Salir del equipo "${team.name}"?`)) return;
    try {
      await routesAPI.removeTeamMember(team.id, user.id);
      flashSuccess('Saliste del equipo');
      await loadAll();
    } catch (err) {
      setError(err.message || 'No se pudo salir del equipo');
    }
  };

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
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl md:text-6xl font-tungsten text-white tracking-wider mb-2">MIS EQUIPOS</h1>
            <div className="h-1 w-32 bg-valorant-red mb-4"></div>
            <p className="text-valorant-light text-lg">Gestiona los equipos a los que perteneces</p>
          </div>
          {canCreateTeam && (
            <button onClick={openCreateForm} className="btn-valorant">
              + Fundar Equipo
            </button>
          )}
        </div>

        {success && (
          <div className="bg-green-500/20 border border-green-500 p-3 mb-4 text-green-400 text-sm font-bold text-center">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-500/20 border border-valorant-red p-3 mb-4 text-valorant-light text-sm text-center">
            {error}
          </div>
        )}

        {teams.length > 0 ? (
          <div className="space-y-6">
            {teams.map(team => (
              <div key={team.id} className="card-valorant p-6">
                <div className="flex flex-col md:flex-row md:items-start gap-6">
                  <TeamLogo path={team.logo} size="md" className="shrink-0" />

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h3 className="text-3xl font-tungsten text-white tracking-wider uppercase">{team.name}</h3>
                      <span className="text-valorant-red font-bold">[{team.tag}]</span>
                      {team.iAmFounder && (
                        <span className="bg-valorant-gold/20 border border-valorant-gold px-2 py-0.5 text-[10px] font-bold uppercase text-valorant-gold">
                          Founder
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-valorant-light flex gap-4 mb-4">
                      <span>Región: <span className="text-white font-bold">{team.region || '—'}</span></span>
                      <span>Plazas: <span className="text-white font-bold">{team.occupied_slots}/{team.max_slots}</span></span>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {team.iAmFounder && (
                        <>
                          <button onClick={() => openEditForm(team)} className="px-3 py-1 text-xs font-bold uppercase border border-valorant-light text-valorant-light hover:bg-valorant-light hover:text-valorant-dark transition-colors">
                            Editar Equipo
                          </button>
                          <button onClick={() => handleDissolveTeam(team)} className="px-3 py-1 text-xs font-bold uppercase border border-valorant-red text-valorant-red hover:bg-valorant-red hover:text-white transition-colors">
                            Disolver Equipo
                          </button>
                        </>
                      )}
                      {!team.iAmFounder && (
                        <button onClick={() => handleLeave(team)} className="px-3 py-1 text-xs font-bold uppercase border border-valorant-red text-valorant-red hover:bg-valorant-red hover:text-white transition-colors">
                          Salir del Equipo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-bold uppercase text-valorant-light mb-3">Plantilla</h4>
                    <div className="space-y-2">
                      {team.members.map(m => (
                        <div key={m.user_id} className="flex justify-between items-center bg-valorant-dark-tertiary p-2 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{m.nickname}</span>
                            <span className="text-[10px] uppercase font-bold text-valorant-light">
                              {ROLE_LABELS[m.role] || m.role}
                            </span>
                            {m.is_founder && <span className="text-[10px] uppercase font-bold text-valorant-gold">Founder</span>}
                          </div>
                          {team.iAmFounder && !m.is_founder && (
                            <button
                              onClick={() => handleKick(team, m)}
                              className="text-valorant-red hover:text-white text-xs font-bold px-2"
                              title="Expulsar"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {team.iAmFounder && (
                    <div>
                      <h4 className="text-sm font-bold uppercase text-valorant-light mb-3">
                        Solicitudes Pendientes ({team.joinRequests?.length || 0})
                      </h4>
                      {team.joinRequests && team.joinRequests.length > 0 ? (
                        <div className="space-y-2">
                          {team.joinRequests.map(req => (
                            <div key={req.id} className="bg-valorant-dark-tertiary p-3 border-l-2 border-valorant-gold">
                              <div className="flex justify-between mb-2">
                                <span className="font-bold text-white text-sm">{req.nickname}</span>
                                <span className="text-xs text-valorant-light">
                                  {req.ingame_role}{req.favorite_agent ? ` · ${req.favorite_agent}` : ''}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAccept(team, req)}
                                  className="flex-1 bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white font-bold uppercase transition-colors py-1 text-xs"
                                >
                                  Aceptar
                                </button>
                                <button
                                  onClick={() => handleReject(team, req)}
                                  className="flex-1 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white font-bold uppercase transition-colors py-1 text-xs"
                                >
                                  Rechazar
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-valorant-dark-tertiary p-4 text-center text-xs text-valorant-light italic">
                          No hay solicitudes pendientes
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-valorant-dark-tertiary border-2 border-dashed border-valorant-dark p-12 text-center">
            <h2 className="text-2xl font-tungsten text-valorant-light mb-4">AÚN NO TIENES EQUIPO</h2>
            {canCreateTeam ? (
              <>
                <p className="text-gray-400 mb-6">Funda tu propio equipo y empieza a reclutar jugadores.</p>
                <button onClick={openCreateForm} className="btn-valorant">Fundar Equipo</button>
              </>
            ) : user?.role === 'player' ? (
              <p className="text-gray-400">
                Como <strong className="text-white">player</strong>, tienes que solicitar unirte a un equipo
                desde la <Link to="/teams" className="text-valorant-red font-bold">lista de equipos</Link>.
              </p>
            ) : (
              <p className="text-gray-400">
                Tu rol actual ({user?.role}) no permite crear ni unirse a equipos.
              </p>
            )}
          </div>
        )}

        <Modal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          title={editingTeamId ? 'Editar Equipo' : 'Fundar Nuevo Equipo'}
        >
          <form onSubmit={handleSaveTeam} className="space-y-4">
            {/* Logo solo en EDIT: el upload necesita un team_id existente. */}
            {editingTeamId && (
              <div>
                <label className="block text-xs font-bold uppercase text-valorant-light mb-2">Logo</label>
                <ImageUploader
                  currentPath={editingTeamLogo}
                  onUpload={async (file) => {
                    const data = await routesAPI.uploadTeamLogo(editingTeamId, file);
                    setEditingTeamLogo(data.logo);
                    await loadAll();
                  }}
                  onDelete={async () => {
                    await routesAPI.deleteTeamLogo(editingTeamId);
                    setEditingTeamLogo(null);
                    await loadAll();
                  }}
                  placeholder="team"
                  label="Subir Logo"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Nombre</label>
              <input
                type="text" name="name" required value={teamForm.name} onChange={handleFormChange}
                className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Tag</label>
                <input
                  type="text" name="tag" required maxLength={10} value={teamForm.tag} onChange={handleFormChange}
                  className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Provincia</label>
                <select
                  name="region" value={teamForm.region} onChange={handleFormChange}
                  className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white"
                >
                  <option value="">Seleccionar...</option>
                  {ANDALUCIA_PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4 mt-6 border-t border-valorant-dark-tertiary gap-3">
              <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-valorant-light hover:text-white font-bold uppercase">
                Cancelar
              </button>
              <button
                type="submit" disabled={submitting}
                className={`bg-valorant-red hover:bg-white hover:text-valorant-red transition-colors text-white px-6 py-2 pb-1 font-tungsten text-xl tracking-wider ${submitting ? 'opacity-50' : ''}`}
              >
                {submitting ? 'GUARDANDO...' : (editingTeamId ? 'GUARDAR' : 'CREAR EQUIPO')}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default MyTeams;
