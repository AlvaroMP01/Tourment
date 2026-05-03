import { useState, useEffect } from 'react';
import { routesAPI } from '../../services/routesAPI';
import Modal from '../Modal';

const emptyTournament = {
  name: '',
  start_date: '',
  end_date: '',
  status: 'upcoming',
  image: '',
  prize: '',
  description: '',
};

const STATUS_OPTIONS = [
  { value: 'upcoming', label: 'Próximamente' },
  { value: 'live', label: 'En Vivo' },
  { value: 'finished', label: 'Finalizado' },
];

const AdminTournaments = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadTournaments = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await routesAPI.getTournaments();
      setTournaments(data);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los torneos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTournaments(); }, []);

  const flashSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      // Backend devuelve null para campos opcionales vacíos; los inputs necesitan strings.
      setEditing({
        ...item,
        image: item.image || '',
        prize: item.prize || '',
        description: item.description || '',
      });
    } else {
      setEditing({ ...emptyTournament });
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

    const payload = {
      name: editing.name,
      start_date: editing.start_date,
      end_date: editing.end_date,
      status: editing.status,
      image: editing.image,
      prize: editing.prize,
      description: editing.description,
    };

    try {
      if (editing.id) {
        await routesAPI.updateTournament(editing.id, payload);
        flashSuccess('Torneo actualizado');
      } else {
        await routesAPI.createTournament(payload);
        flashSuccess('Torneo creado');
      }
      handleClose();
      await loadTournaments();
    } catch (err) {
      setError(err.message || 'No se pudo guardar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (t) => {
    if (!window.confirm(`¿Eliminar el torneo "${t.name}"? Sus matches también se borrarán.`)) return;
    try {
      await routesAPI.deleteTournament(t.id);
      flashSuccess('Torneo borrado');
      await loadTournaments();
    } catch (err) {
      setError(err.message || 'No se pudo borrar');
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-tungsten text-white mb-6 tracking-wider">
        GESTIÓN DE TORNEOS
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

      <div className="mb-6 flex justify-between items-center">
        <button onClick={() => handleOpenModal()} className="btn-valorant">
          + Crear Nuevo Torneo
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
                  <th className="p-3">Nombre</th>
                  <th className="p-3">Inicio</th>
                  <th className="p-3">Fin</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tournaments.length > 0 ? tournaments.map(t => (
                  <tr key={t.id} className="border-b border-valorant-dark hover:bg-valorant-dark-secondary">
                    <td className="p-3 font-bold text-white">{t.name}</td>
                    <td className="p-3">{t.start_date}</td>
                    <td className="p-3">{t.end_date}</td>
                    <td className="p-3 uppercase">
                      <span className={`px-2 py-1 text-xs font-bold rounded ${t.status === 'live' ? 'bg-valorant-red text-white' : 'bg-gray-700 text-gray-200'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button onClick={() => handleOpenModal(t)} className="text-valorant-light hover:text-white mr-3 font-bold">Editar</button>
                      <button onClick={() => handleDelete(t)} className="text-valorant-red hover:text-white font-bold">Borrar</button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="p-6 text-center text-valorant-light">No hay torneos registrados</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={editing?.id ? 'Editar Torneo' : 'Crear Torneo'}
      >
        {editing && (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Nombre</label>
              <input
                type="text" name="name" required value={editing.name} onChange={handleChange}
                className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-valorant-light mb-1">
                  Imagen <span className="text-valorant-light/60 normal-case">(URL o emoji)</span>
                </label>
                <input
                  type="text" name="image" value={editing.image} onChange={handleChange}
                  placeholder="🏆  o  https://..."
                  className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-valorant-light mb-1">
                  Premio <span className="text-valorant-light/60 normal-case">(texto libre)</span>
                </label>
                <input
                  type="text" name="prize" maxLength={100} value={editing.prize} onChange={handleChange}
                  placeholder="€10.000, Premio simbólico..."
                  className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Descripción</label>
              <textarea
                name="description" rows={3} value={editing.description} onChange={handleChange}
                placeholder="Una breve descripción del torneo..."
                className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white resize-y"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Fecha Inicio</label>
                <input
                  type="date" name="start_date" required value={editing.start_date} onChange={handleChange}
                  className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Fecha Fin</label>
                <input
                  type="date" name="end_date" required value={editing.end_date} onChange={handleChange}
                  className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Estado</label>
              <select
                name="status" value={editing.status} onChange={handleChange}
                className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white"
              >
                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
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

export default AdminTournaments;
