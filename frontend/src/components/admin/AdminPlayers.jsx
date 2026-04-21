import { useState } from 'react';
import { mockPlayers } from '../../data/mockData';
import Modal from '../Modal';

const defaultPlayer = {
  id: '',
  name: '',
  team: '',
  role: 'Duelist',
  mainAgent: 'Jett',
  rank: 1,
  stats: {
    kills: 0,
    deaths: 0,
    assists: 0,
    kd: 1.0,
    adr: 100,
    hs: "20%",
    clutches: 0
  }
};

const AdminPlayers = () => {
  const [players, setPlayers] = useState([...mockPlayers]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem({ ...item });
    } else {
      setEditingItem({ ...defaultPlayer, id: Date.now() });
    }
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setErrorMsg('');
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este jugador?')) {
      const updated = players.filter(t => t.id !== id);
      setPlayers(updated);
      
      const idx = mockPlayers.findIndex(t => t.id === id);
      if (idx !== -1) mockPlayers.splice(idx, 1);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Validar máximo de 7 jugadores por equipo
    const sameTeamPlayers = players.filter(p => p.team.trim().toLowerCase() === editingItem.team.trim().toLowerCase() && p.id !== editingItem.id);
    if (sameTeamPlayers.length >= 7) {
      setErrorMsg(`El equipo "${editingItem.team}" ya tiene el máximo permitido de 7 jugadores.`);
      return;
    }

    const existingIdx = players.findIndex(t => t.id === editingItem.id);
    
    let updated;
    if (existingIdx >= 0) {
      updated = [...players];
      updated[existingIdx] = editingItem;
      const idx = mockPlayers.findIndex(t => t.id === editingItem.id);
      if (idx !== -1) mockPlayers[idx] = editingItem;
    } else {
      updated = [...players, editingItem];
      mockPlayers.push(editingItem);
    }
    
    setPlayers(updated);
    handleCloseModal();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (['kills', 'deaths', 'assists', 'kd', 'adr', 'clutches', 'hs'].includes(name)) {
      setEditingItem(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          [name]: name === 'hs' ? value : parseFloat(value) || 0
        }
      }));
    } else {
      setEditingItem(prev => ({ 
        ...prev, 
        [name]: name === 'rank' ? parseInt(value) || 1 : value 
      }));
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-tungsten text-white mb-6 tracking-wider">
        GESTIÓN DE JUGADORES
      </h2>
      
      <div className="mb-6 flex justify-between items-center">
        <button onClick={() => handleOpenModal()} className="btn-valorant">
          + Añadir Jugador
        </button>
      </div>

      <div className="bg-valorant-dark-tertiary p-6 clip-corner-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-valorant-light text-sm">
            <thead className="bg-valorant-dark text-white uppercase font-tungsten text-lg">
              <tr>
                <th className="p-3">Rank</th>
                <th className="p-3">Jugador</th>
                <th className="p-3">Equipo</th>
                <th className="p-3">Rol / Agente</th>
                <th className="p-3">K/D (ADR)</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {players.length > 0 ? players.sort((a,b)=>a.rank-b.rank).map(p => (
                <tr key={p.id} className="border-b border-valorant-dark hover:bg-valorant-dark-secondary">
                  <td className="p-3 text-valorant-red font-bold">#{p.rank}</td>
                  <td className="p-3 font-bold text-white">{p.name}</td>
                  <td className="p-3">{p.team}</td>
                  <td className="p-3">{p.role} - {p.mainAgent}</td>
                  <td className="p-3">{p.stats.kd} ({p.stats.adr})</td>
                  <td className="p-3 text-right">
                    <button onClick={() => handleOpenModal(p)} className="text-valorant-light hover:text-white mr-3 font-bold">Editar</button>
                    <button onClick={() => handleDelete(p.id)} className="text-valorant-red hover:text-white font-bold">Borrar</button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-valorant-light">No hay jugadores registrados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingItem?.id && typeof editingItem.id !== 'number' ? 'Editar Jugador' : 'Añadir Jugador'}
      >
        {editingItem && (
          <form onSubmit={handleSave} className="space-y-4">
            {errorMsg && (
              <div className="bg-red-500/20 border border-valorant-red p-3 clip-corner-sm text-valorant-light text-sm text-center">
                {errorMsg}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div>
                <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Nick del Jugador</label>
                <input 
                  type="text" name="name" required value={editingItem.name} onChange={handleChange}
                  className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Alineación (Equipo)</label>
                <input 
                  type="text" name="team" required value={editingItem.team} onChange={handleChange}
                  className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Rol Principal</label>
                <select 
                  name="role" value={editingItem.role} onChange={handleChange}
                  className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white"
                >
                  <option value="Duelist">Duelist</option>
                  <option value="Initiator">Initiator</option>
                  <option value="Controller">Controller</option>
                  <option value="Sentinel">Sentinel</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Agente Favorito</label>
                <input 
                  type="text" name="mainAgent" value={editingItem.mainAgent} onChange={handleChange}
                  className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Rango Global</label>
                <input 
                  type="number" name="rank" value={editingItem.rank} onChange={handleChange} min="1"
                  className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white"
                />
              </div>

            </div>

            <div className="border-t border-valorant-dark-tertiary mt-4 pt-4">
              <h4 className="text-valorant-red font-bold uppercase mb-4">Estadísticas</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-valorant-light mb-1">K/D</label>
                  <input type="number" step="0.01" name="kd" value={editingItem.stats.kd} onChange={handleChange} className="w-full bg-valorant-dark-secondary p-2 text-white outline-none"/>
                </div>
                <div>
                  <label className="block text-xs text-valorant-light mb-1">ADR</label>
                  <input type="number" name="adr" value={editingItem.stats.adr} onChange={handleChange} className="w-full bg-valorant-dark-secondary p-2 text-white outline-none"/>
                </div>
                <div>
                  <label className="block text-xs text-valorant-light mb-1">Headshot %</label>
                  <input type="text" name="hs" value={editingItem.stats.hs} onChange={handleChange} className="w-full bg-valorant-dark-secondary p-2 text-white outline-none"/>
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

export default AdminPlayers;
