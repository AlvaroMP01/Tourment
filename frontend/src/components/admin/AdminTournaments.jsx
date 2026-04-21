import { useState } from 'react';
import { mockTournaments } from '../../data/mockData';
import Modal from '../Modal';

const defaultTournament = {
  id: '',
  name: '',
  status: 'upcoming',
  startDate: '',
  endDate: '',
  prize: '',
  teams: 0,
  region: '',
  image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=400&fit=crop',
  description: ''
};

const AdminTournaments = () => {
  const [tournaments, setTournaments] = useState([...mockTournaments]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem({ ...item });
    } else {
      setEditingItem({ ...defaultTournament, id: Date.now() });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este torneo?')) {
      const updated = tournaments.filter(t => t.id !== id);
      setTournaments(updated);
      
      // Mutate original mockData to persist in this session
      const idx = mockTournaments.findIndex(t => t.id === id);
      if (idx !== -1) mockTournaments.splice(idx, 1);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    const existingIdx = tournaments.findIndex(t => t.id === editingItem.id);
    
    let updated;
    if (existingIdx >= 0) {
      updated = [...tournaments];
      updated[existingIdx] = editingItem;
      const idx = mockTournaments.findIndex(t => t.id === editingItem.id);
      if (idx !== -1) mockTournaments[idx] = editingItem;
    } else {
      updated = [...tournaments, editingItem];
      mockTournaments.push(editingItem);
    }
    
    setTournaments(updated);
    handleCloseModal();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditingItem(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div>
      <h2 className="text-3xl font-tungsten text-white mb-6 tracking-wider">
        GESTIÓN DE TORNEOS
      </h2>
      
      <div className="mb-6 flex justify-between items-center">
        <button onClick={() => handleOpenModal()} className="btn-valorant">
          + Crear Nuevo Torneo
        </button>
      </div>

      <div className="bg-valorant-dark-tertiary p-6 clip-corner-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-valorant-light text-sm">
            <thead className="bg-valorant-dark text-white uppercase font-tungsten text-lg">
              <tr>
                <th className="p-3">Nombre</th>
                <th className="p-3">Región</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Premio</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tournaments.length > 0 ? tournaments.map(t => (
                <tr key={t.id} className="border-b border-valorant-dark hover:bg-valorant-dark-secondary">
                  <td className="p-3 font-bold text-white">{t.name}</td>
                  <td className="p-3">{t.region}</td>
                  <td className="p-3 uppercase">
                    <span className={`px-2 py-1 text-xs font-bold rounded ${t.status === 'live' ? 'bg-valorant-red text-white' : 'bg-gray-700 text-gray-200'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="p-3">{t.prize}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => handleOpenModal(t)} className="text-valorant-light hover:text-white mr-3 font-bold">Editar</button>
                    <button onClick={() => handleDelete(t.id)} className="text-valorant-red hover:text-white font-bold">Borrar</button>
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
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingItem?.name ? 'Editar Torneo' : 'Crear Torneo'}
      >
        {editingItem && (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Nombre del Torneo</label>
                <input 
                  type="text" name="name" required value={editingItem.name} onChange={handleChange}
                  className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white"
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
                <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Fecha de Inicio</label>
                <input 
                  type="date" name="startDate" value={editingItem.startDate} onChange={handleChange}
                  className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Fecha de Fin</label>
                <input 
                  type="date" name="endDate" value={editingItem.endDate} onChange={handleChange}
                  className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Premio</label>
                <input 
                  type="text" name="prize" value={editingItem.prize} onChange={handleChange}
                  className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Nº Equipos</label>
                <input 
                  type="number" name="teams" value={editingItem.teams} onChange={handleChange}
                  className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white"
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold uppercase text-valorant-light mb-1">Descripción</label>
                <textarea 
                  name="description" rows="3" value={editingItem.description} onChange={handleChange}
                  className="w-full bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-2 text-white"
                ></textarea>
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold uppercase text-valorant-light mb-1">URL Imagen</label>
                <input 
                  type="url" name="image" value={editingItem.image} onChange={handleChange}
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

export default AdminTournaments;
