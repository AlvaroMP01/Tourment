import { useState, useEffect } from 'react';
import { routesAPI } from '../../services/routesAPI';
import { useAuth } from '../../context/AuthContext';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin', color: 'text-valorant-red' },
  { value: 'tournament_manager', label: 'Tournament Manager', color: 'text-valorant-gold' },
  { value: 'coach', label: 'Coach', color: 'text-blue-400' },
  { value: 'player_coach', label: 'Player/Coach', color: 'text-purple-400' },
  { value: 'player', label: 'Player', color: 'text-valorant-light' },
];

const roleLabel = (value) => ROLE_OPTIONS.find(r => r.value === value)?.label || value;
const roleColor = (value) => ROLE_OPTIONS.find(r => r.value === value)?.color || 'text-valorant-light';

const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pendingId, setPendingId] = useState(null);

  const flashSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await routesAPI.adminGetUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleRoleChange = async (u, newRole) => {
    if (newRole === u.role) return;
    setPendingId(u.id);
    setError('');
    try {
      await routesAPI.adminUpdateUserRole(u.id, newRole);
      flashSuccess(`Rol de ${u.nickname} → ${roleLabel(newRole)}`);
      await loadUsers();
    } catch (err) {
      setError(err.message || 'No se pudo cambiar el rol');
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`¿Eliminar definitivamente al usuario "${u.nickname}"? Esta acción es irreversible.`)) return;
    setPendingId(u.id);
    setError('');
    try {
      await routesAPI.adminDeleteUser(u.id);
      flashSuccess(`Usuario ${u.nickname} eliminado`);
      await loadUsers();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar');
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-tungsten text-white mb-6 tracking-wider">
        GESTIÓN DE USUARIOS DEL SISTEMA
      </h2>

      {success && (
        <div className="bg-green-500/20 border border-green-500 p-3 mb-4 clip-corner-sm text-green-400 text-sm font-bold text-center">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-500/20 border border-valorant-red p-3 mb-4 clip-corner-sm text-valorant-light text-sm text-center">
          {error}
        </div>
      )}

      <div className="bg-valorant-dark-tertiary p-6 clip-corner-sm">
        {loading ? (
          <div className="text-center py-8 text-valorant-light">Cargando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-valorant-light text-sm">
              <thead className="bg-valorant-dark text-white uppercase font-tungsten text-lg">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Nickname</th>
                  <th className="p-3">Rol Actual</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? users.map(u => {
                  const isMe = currentUser?.id === u.id;
                  const isBusy = pendingId === u.id;
                  return (
                    <tr key={u.id} className="border-b border-valorant-dark hover:bg-valorant-dark-secondary">
                      <td className="p-3 text-valorant-light">{u.id}</td>
                      <td className="p-3 font-bold text-white">
                        {u.nickname}
                        {isMe && <span className="ml-2 text-xs text-valorant-red font-normal">(VOS)</span>}
                      </td>
                      <td className={`p-3 font-bold uppercase ${roleColor(u.role)}`}>
                        {roleLabel(u.role)}
                      </td>
                      <td className="p-3 flex justify-end items-center gap-2">
                        <select
                          value={u.role}
                          disabled={isMe || isBusy}
                          onChange={(e) => handleRoleChange(u, e.target.value)}
                          className="bg-valorant-dark border border-valorant-red/30 text-white p-2 font-bold uppercase focus:border-valorant-red focus:outline-none transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title={isMe ? 'No podés cambiar tu propio rol' : ''}
                        >
                          {ROLE_OPTIONS.map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleDelete(u)}
                          disabled={isMe || isBusy}
                          className="text-valorant-red hover:text-white font-bold uppercase transition-colors px-3 py-2 bg-valorant-dark hover:bg-valorant-red/20 border border-valorant-red/30 disabled:opacity-40 disabled:cursor-not-allowed"
                          title={isMe ? 'No podés borrarte a vos mismo' : 'Eliminar usuario'}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="4" className="p-6 text-center text-valorant-light">No hay usuarios</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-valorant-light mt-4 italic">
        El sistema impide degradar o borrar al último admin. Tampoco podés modificar tu propio rol —
        debe hacerlo otro admin.
      </p>
    </div>
  );
};

export default AdminUsers;
