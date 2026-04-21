import { useState } from 'react';
import { mockMatches, mockTeams } from '../../data/mockData';
import Modal from '../Modal';

const defaultMatch = {
  id: '',
  tournamentId: 1,
  team1: null,
  team2: null,
  score1: 0,
  score2: 0,
  status: 'upcoming',
  date: '',
  map: '',
  round: ''
};

const AdminMatches = () => {
  const [matches, setMatches] = useState([...mockMatches]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem({ ...item });
    } else {
      setEditingItem({ ...defaultMatch, id: Date.now(), team1: mockTeams[0], team2: mockTeams[1] });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este partido?')) {
      const updated = matches.filter(t => t.id !== id);
      setMatches(updated);
      
      const idx = mockMatches.findIndex(t => t.id === id);
      if (idx !== -1) mockMatches.splice(idx, 1);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    const existingIdx = matches.findIndex(t => t.id === editingItem.id);
    
    let updated;
    if (existingIdx >= 0) {
      updated = [...matches];
      updated[existingIdx] = editingItem;
      const idx = mockMatches.findIndex(t => t.id === editingItem.id);
      if (idx !== -1) mockMatches[idx] = editingItem;
    } else {
      updated = [...matches, editingItem];
      mockMatches.push(editingItem);
    }
    
    setMatches(updated);
    handleCloseModal();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'team1Id') {
      const t = mockTeams.find(x => x.id === parseInt(value));
      setEditingItem(prev => ({ ...prev, team1: t }));
    } else if (name === 'team2Id') {
      const t = mockTeams.find(x => x.id === parseInt(value));
      setEditingItem(prev => ({ ...prev, team2: t }));
    } else {
      setEditingItem(prev => ({ 
        ...prev, 
        [name]: name === 'score1' || name === 'score2' ? parseInt(value) || 0 : value 
      }));
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-tungsten text-white mb-6 tracking-wider">
        GESTIÓN DE PARTIDOS
      </h2>
      
      <div className="mb-6 flex justify-between items-center">
        <button onClick={() => handleOpenModal()} className="btn-valorant">
          + Programar Partido
        </button>
      </div>

      <div className="bg-valorant-dark-tertiary p-6 clip-corner-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-valorant-light text-sm">
            <thead className="bg-valorant-dark text-white uppercase font-tungsten text-lg">
              <tr>
                <th className="p-3">Partido</th>
                <th className="p-3">Resultado</th>
                <th className="p-3">Fecha</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Ronda</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {matches.length > 0 ? matches.map(m => (
                <tr key={m.id} className="border-b border-valorant-dark hover:bg-valorant-dark-secondary">
                  <td className="p-3 font-bold text-white">
                    {m.team1?.name} vs {m.team2?.name}
                  </td>
                  <td className="p-3 text-valorant-red font-bold">
                    {m.score1 !== null ? `${m.score1} - ${m.score2}` : 'TBD'}
                  </td>
                  <td className="p-3">{m.date ? new Date(m.date).toLocaleDateString() : 'Por definir'}</td>
                  <td className="p-3 uppercase">
                    <span className={`px-2 py-1 text-xs font-bold rounded ${m.status === 'live' ? 'bg-valorant-red text-white' : 'bg-gray-700 text-gray-200'}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="p-3">{m.round}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => handleOpenModal(m)} className="text-valorant-light hover:text-white mr-3 font-bold">Editar</button>
                    <button onClick={() => handleDelete(m.id)} className="text-valorant-red hover:text-white font-bold">Borrar</button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-valorant-light">No hay partidos programados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingItem?.id && typeof editingItem.id !== 'number' ? 'Editar Partido' : 'Programar Partido'}
      >
        {editingItem && (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div>
                <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Equipo 1</label>
                <select 
                  name="team1Id" required value={editingItem.team1?.id || ''} onChange={handleChange}
                  className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white"
                >
                  <option value="">Selecciona equipo</option>
                  {mockTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Equipo 2</label>
                <select 
                  name="team2Id" required value={editingItem.team2?.id || ''} onChange={handleChange}
                  className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white"
                >
                  <option value="">Selecciona equipo</option>
                  {mockTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Puntuación Eq. 1</label>
                <input 
                  type="number" name="score1" value={editingItem.score1} onChange={handleChange} min="0"
                  className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Puntuación Eq. 2</label>
                <input 
                  type="number" name="score2" value={editingItem.score2} onChange={handleChange} min="0"
                  className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Estado</label>
                <select 
                  name="status" value={editingItem.status} onChange={handleChange}
                  className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white"
                >
                  <option value="upcoming">Próximamente</option>
                  <option value="live">En Vivo</option>
                  <option value="completed">Finalizado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Mapa</label>
                <input 
                  type="text" name="map" value={editingItem.map} onChange={handleChange} placeholder="Ej: Ascent, Bind..."
                  className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Ronda</label>
                <input 
                  type="text" name="round" required value={editingItem.round} onChange={handleChange} placeholder="Ej: Semifinals"
                  className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Fecha</label>
                <input 
                  type="datetime-local" name="date" value={editingItem.date ? new Date(editingItem.date).toISOString().slice(0,16) : ''} 
                  onChange={(e) => handleChange({ target: { name: 'date', value: e.target.value }})}
                  className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white"
                />
              </div>

            </div>

            <div className="flex justify-end pt-4 mt-6 border-t border-valorant-dark-tertiary gap-3">
              <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-valorant-light hover:text-white font-bold uppercase">
                Cancelar
              </button>
              <button type="submit" className="bg-valorant-red hover:bg-white hover:text-valorant-red transition-colors text-white px-6 py-2 pb-1 font-tungsten text-xl tracking-wider">
                GUARDAR
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default AdminMatches;
