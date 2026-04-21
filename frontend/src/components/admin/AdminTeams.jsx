import { useState } from 'react';
import { mockTeams } from '../../data/mockData';
import Modal from '../Modal';

const defaultTeam = {
  id: '',
  name: '',
  tag: '',
  logo: '🎮',
  region: '',
  wins: 0,
  losses: 0,
  rank: 99,
  players: []
};

const AdminTeams = () => {
  const [teams, setTeams] = useState([...mockTeams]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem({ ...item });
    } else {
      setEditingItem({ ...defaultTeam, id: Date.now() });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este equipo?')) {
      const updated = teams.filter(t => t.id !== id);
      setTeams(updated);
      
      const idx = mockTeams.findIndex(t => t.id === id);
      if (idx !== -1) mockTeams.splice(idx, 1);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    const existingIdx = teams.findIndex(t => t.id === editingItem.id);
    
    let updated;
    if (existingIdx >= 0) {
      updated = [...teams];
      updated[existingIdx] = editingItem;
      const idx = mockTeams.findIndex(t => t.id === editingItem.id);
      if (idx !== -1) mockTeams[idx] = editingItem;
    } else {
      updated = [...teams, editingItem];
      mockTeams.push(editingItem);
    }
    
    setTeams(updated);
    handleCloseModal();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditingItem(prev => ({ 
      ...prev, 
      [name]: name === 'wins' || name === 'losses' || name === 'rank' ? parseInt(value) || 0 : value 
    }));
  };

  return (
    <div>
      <h2 className="text-3xl font-tungsten text-white mb-6 tracking-wider">
        GESTIÓN DE EQUIPOS
      </h2>
      
      <div className="mb-6 flex justify-between items-center">
        <button onClick={() => handleOpenModal()} className="btn-valorant">
          + Registrar Equipo
        </button>
      </div>

      <div className="bg-valorant-dark-tertiary p-6 clip-corner-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-valorant-light text-sm">
            <thead className="bg-valorant-dark text-white uppercase font-tungsten text-lg">
              <tr>
                <th className="p-3">Rango</th>
                <th className="p-3">Equipo</th>
                <th className="p-3">Tag</th>
                <th className="p-3">Región</th>
                <th className="p-3">W/L</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {teams.length > 0 ? teams.sort((a,b)=> a.rank - b.rank).map(t => (
                <tr key={t.id} className="border-b border-valorant-dark hover:bg-valorant-dark-secondary">
                  <td className="p-3 text-valorant-red font-bold">#{t.rank}</td>
                  <td className="p-3 font-bold text-white flex items-center gap-2">
                    <span className="text-xl flex items-center justify-center">
                      {t.logo && t.logo.startsWith('http') ? (
                        <img src={t.logo} alt="Logo" className="w-8 h-8 object-cover clip-corner-sm" />
                      ) : (
                        t.logo
                      )}
                    </span> 
                    {t.name}
                  </td>
                  <td className="p-3 font-bold">{t.tag}</td>
                  <td className="p-3">{t.region}</td>
                  <td className="p-3">{t.wins} - {t.losses}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => handleOpenModal(t)} className="text-valorant-light hover:text-white mr-3 font-bold">Editar</button>
                    <button onClick={() => handleDelete(t.id)} className="text-valorant-red hover:text-white font-bold">Borrar</button>
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
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingItem?.name ? 'Editar Equipo' : 'Registrar Equipo'}
      >
        {editingItem && (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-2 flex gap-4">
                <div className="w-20">
                  <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Logo (URL o Emoji)</label>
                  <input 
                    type="text" name="logo" value={editingItem.logo} onChange={handleChange}
                    className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white text-center text-xl"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Nombre del Equipo</label>
                  <input 
                    type="text" name="name" required value={editingItem.name} onChange={handleChange}
                    className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Tag (Acrónimo)</label>
                <input 
                  type="text" name="tag" required value={editingItem.tag} onChange={handleChange} maxLength={4}
                  className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white uppercase"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Región</label>
                <input 
                  type="text" name="region" required value={editingItem.region} onChange={handleChange}
                  className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Rank Global</label>
                <input 
                  type="number" name="rank" value={editingItem.rank} onChange={handleChange} min="1"
                  className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Victorias</label>
                  <input 
                    type="number" name="wins" value={editingItem.wins} onChange={handleChange} min="0"
                    className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Derrotas</label>
                  <input 
                    type="number" name="losses" value={editingItem.losses} onChange={handleChange} min="0"
                    className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white"
                  />
                </div>
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

export default AdminTeams;
