import { useState, useEffect } from 'react';
import { routesAPI } from '../../services/routesAPI';
import Modal from '../Modal';
import AdminReportMatchModal from './AdminReportMatchModal';

const emptyMatch = {
  team1_id: '',
  team2_id: '',
  map_name: '',
  round_name: '',
  match_date: '',
  status: 'scheduled',
};

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Programado' },
  { value: 'live', label: 'En Vivo' },
];

const AdminMatches = () => {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [reportingMatch, setReportingMatch] = useState(null);

  const flashSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  // Carga inicial: tournaments + teams (catálogos para los selects)
  useEffect(() => {
    const loadCatalogs = async () => {
      setLoading(true);
      try {
        const [ts, tms] = await Promise.all([
          routesAPI.getTournaments(),
          routesAPI.getTeams(),
        ]);
        setTournaments(ts);
        setTeams(tms);
        if (ts.length > 0) setSelectedTournament(String(ts[0].id));
      } catch (err) {
        setError(err.message || 'No se pudieron cargar catálogos');
      } finally {
        setLoading(false);
      }
    };
    loadCatalogs();
  }, []);

  // Cargar matches del tournament seleccionado
  useEffect(() => {
    if (!selectedTournament) return;
    const loadMatches = async () => {
      setError('');
      try {
        const data = await routesAPI.getTournamentMatches(selectedTournament);
        setMatches(data);
      } catch (err) {
        setError(err.message || 'No se pudieron cargar los matches');
      }
    };
    loadMatches();
  }, [selectedTournament]);

  const reloadMatches = async () => {
    if (!selectedTournament) return;
    const data = await routesAPI.getTournamentMatches(selectedTournament);
    setMatches(data);
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      // Backend devuelve match_date como ISO o null. Lo paso a 'YYYY-MM-DDTHH:mm' para datetime-local
      const dt = item.date ? new Date(item.date).toISOString().slice(0, 16) : '';
      setEditing({
        id: item.id,
        team1_id: String(item.team1_id || ''),
        team2_id: String(item.team2_id || ''),
        map_name: item.map || '',
        round_name: item.round || '',
        match_date: dt,
        status: item.status,
      });
    } else {
      setEditing({ ...emptyMatch });
    }
    setError('');
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditing(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditing(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (editing.team1_id === editing.team2_id) {
      setError('Los dos equipos deben ser distintos');
      setSubmitting(false);
      return;
    }

    const payload = {
      team1_id: parseInt(editing.team1_id),
      team2_id: parseInt(editing.team2_id),
      map_name: editing.map_name || null,
      round_name: editing.round_name || null,
      match_date: editing.match_date || null,
      status: editing.status,
    };

    try {
      if (editing.id) {
        await routesAPI.updateMatch(selectedTournament, editing.id, payload);
        flashSuccess('Match actualizado');
      } else {
        await routesAPI.createMatch(selectedTournament, payload);
        flashSuccess('Match programado');
      }
      handleClose();
      await reloadMatches();
    } catch (err) {
      setError(err.message || 'No se pudo guardar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (match) => {
    if (match.status === 'finished') {
      setError('No se puede borrar un match finalizado (sus stats afectan UserStat)');
      return;
    }
    if (!window.confirm('¿Borrar este match?')) return;
    try {
      await routesAPI.deleteMatch(selectedTournament, match.id);
      flashSuccess('Match borrado');
      await reloadMatches();
    } catch (err) {
      setError(err.message || 'No se pudo borrar');
    }
  };

  const teamName = (id) => {
    const t = teams.find(x => x.id === id);
    return t ? `${t.name} [${t.tag}]` : `#${id}`;
  };

  return (
    <div>
      <h2 className="text-3xl font-tungsten text-white mb-6 tracking-wider">
        GESTIÓN DE PARTIDOS
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

      <div className="mb-6 flex justify-between items-center gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold uppercase text-valorant-light">Torneo</label>
          <select
            value={selectedTournament}
            onChange={(e) => setSelectedTournament(e.target.value)}
            className="bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white min-w-64"
          >
            {tournaments.length === 0 && <option value="">(no hay torneos)</option>}
            {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <button
          onClick={() => handleOpenModal()}
          disabled={!selectedTournament}
          className={`btn-valorant ${!selectedTournament ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          + Programar Partido
        </button>
      </div>

      <div className="bg-valorant-dark-tertiary p-6 clip-corner-sm">
        {loading ? (
          <div className="text-center py-8 text-valorant-light">Cargando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-valorant-light text-sm">
              <thead className="bg-valorant-dark text-white uppercase font-tungsten text-lg">
                <tr>
                  <th className="p-3">Partido</th>
                  <th className="p-3">Resultado</th>
                  <th className="p-3">Mapa</th>
                  <th className="p-3">Ronda</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {matches.length > 0 ? matches.map(m => (
                  <tr key={m.id} className="border-b border-valorant-dark hover:bg-valorant-dark-secondary">
                    <td className="p-3 font-bold text-white">
                      {teamName(m.team1_id)} vs {teamName(m.team2_id)}
                    </td>
                    <td className="p-3 text-valorant-red font-bold">{m.score}</td>
                    <td className="p-3">{m.map || '-'}</td>
                    <td className="p-3">{m.round || '-'}</td>
                    <td className="p-3 uppercase">
                      <span className={`px-2 py-1 text-xs font-bold rounded ${m.status === 'live' ? 'bg-valorant-red text-white' : m.status === 'finished' ? 'bg-green-700 text-white' : 'bg-gray-700 text-gray-200'}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {m.status !== 'finished' && (
                        <>
                          <button onClick={() => setReportingMatch(m)} className="text-valorant-gold hover:text-white mr-3 font-bold">Reportar</button>
                          <button onClick={() => handleOpenModal(m)} className="text-valorant-light hover:text-white mr-3 font-bold">Editar</button>
                          <button onClick={() => handleDelete(m)} className="text-valorant-red hover:text-white font-bold">Borrar</button>
                        </>
                      )}
                      {m.status === 'finished' && (
                        <span className="text-xs text-valorant-light italic">Finalizado (inmutable)</span>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="p-6 text-center text-valorant-light">No hay matches en este torneo</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-valorant-light mt-4 italic">
        Usá el botón <strong className="text-valorant-gold">Reportar</strong> para registrar el resultado y las stats por jugador.
        Las stats no se editan a mano — se calculan automáticamente desde lo reportado.
      </p>

      <AdminReportMatchModal
        tournamentId={selectedTournament}
        match={reportingMatch}
        teamsCatalog={teams}
        isOpen={!!reportingMatch}
        onClose={() => setReportingMatch(null)}
        onReported={() => {
          flashSuccess('Resultado reportado');
          reloadMatches();
        }}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={editing?.id ? 'Editar Partido' : 'Programar Partido'}
      >
        {editing && (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Equipo 1</label>
                <select
                  name="team1_id" required value={editing.team1_id} onChange={handleChange}
                  className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white"
                >
                  <option value="">Selecciona equipo</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name} [{t.tag}]</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Equipo 2</label>
                <select
                  name="team2_id" required value={editing.team2_id} onChange={handleChange}
                  className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white"
                >
                  <option value="">Selecciona equipo</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name} [{t.tag}]</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Mapa</label>
                <input
                  type="text" name="map_name" value={editing.map_name} onChange={handleChange}
                  placeholder="Ascent, Bind..."
                  className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Ronda</label>
                <input
                  type="text" name="round_name" value={editing.round_name} onChange={handleChange}
                  placeholder="Semifinal, Jornada 1..."
                  className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Fecha</label>
                <input
                  type="datetime-local" name="match_date" value={editing.match_date} onChange={handleChange}
                  className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Estado</label>
                <select
                  name="status" value={editing.status} onChange={handleChange}
                  className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white"
                >
                  {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <p className="text-xs text-valorant-light mt-1 italic">'finished' se setea al reportar resultado</p>
              </div>
            </div>

            <div className="flex justify-end pt-4 mt-6 border-t border-valorant-dark-tertiary gap-3">
              <button type="button" onClick={handleClose} className="px-4 py-2 text-valorant-light hover:text-white font-bold uppercase">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`bg-valorant-red hover:bg-white hover:text-valorant-red transition-colors text-white px-6 py-2 pb-1 font-tungsten text-xl tracking-wider ${submitting ? 'opacity-50' : ''}`}
              >
                {submitting ? 'GUARDANDO...' : 'GUARDAR'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default AdminMatches;
