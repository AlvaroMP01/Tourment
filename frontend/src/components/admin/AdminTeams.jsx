import { useState, useEffect } from 'react';
import { routesAPI } from '../../services/routesAPI';
import TeamLogo from '../TeamLogo';

const AdminTeams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pendingId, setPendingId] = useState(null);

  const flashSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const loadTeams = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await routesAPI.getTeams();
      setTeams(data);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los equipos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTeams(); }, []);

  const handleDelete = async (team) => {
    const confirmMsg = `¿Disolver el equipo "${team.name}"?\n\nLos miembros saldrán y los matches relacionados se borrarán por cascada. Esta acción es irreversible.`;
    if (!window.confirm(confirmMsg)) return;
    setPendingId(team.id);
    setError('');
    try {
      await routesAPI.deleteTeam(team.id);
      flashSuccess(`Equipo "${team.name}" disuelto`);
      await loadTeams();
    } catch (err) {
      setError(err.message || 'No se pudo borrar el equipo');
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-tungsten text-white mb-6 tracking-wider">
        EQUIPOS DEL SISTEMA
      </h2>

      <div className="bg-valorant-dark/50 border-l-4 border-valorant-red p-4 mb-6 text-sm text-valorant-light">
        Los equipos los <strong>crea su fundador</strong> (coach o player_coach) — desde acá solo podés
        verlos y disolver los problemáticos. Las ediciones de equipo (nombre, tag, logo, región) las hace
        el founder en su propio panel.
      </div>

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
                  <th className="p-3">Equipo</th>
                  <th className="p-3">Tag</th>
                  <th className="p-3">Región</th>
                  <th className="p-3">Miembros</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {teams.length > 0 ? teams.map(t => (
                  <tr key={t.id} className="border-b border-valorant-dark hover:bg-valorant-dark-secondary">
                    <td className="p-3 text-valorant-light">{t.id}</td>
                    <td className="p-3 font-bold text-white">
                      <div className="flex items-center gap-2">
                        <TeamLogo path={t.logo} size="xs" />
                        {t.name}
                      </div>
                    </td>
                    <td className="p-3 font-bold">[{t.tag}]</td>
                    <td className="p-3">{t.region || '-'}</td>
                    <td className="p-3">{t.member_count} / 7</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDelete(t)}
                        disabled={pendingId === t.id}
                        className="text-valorant-red hover:text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Disolver
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="p-6 text-center text-valorant-light">No hay equipos registrados</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTeams;
