import { useState, useEffect } from 'react';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const usersStr = localStorage.getItem('usersDB');
    if (usersStr) {
      setUsers(JSON.parse(usersStr));
    }
  }, []);

  const handleRoleChange = (username, newRole) => {
    const updatedUsers = users.map(user => {
      if (user.username === username) {
        return { ...user, role: newRole };
      }
      return user;
    });
    setUsers(updatedUsers);
    localStorage.setItem('usersDB', JSON.stringify(updatedUsers));
    setSuccessMsg(`Rol de ${username} actualizado a ${newRole}.`);
    
    // Auto-hide success message after 3 seconds
    setTimeout(() => {
      setSuccessMsg('');
    }, 3000);
  };

  const handleDeleteUser = (username) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar al usuario ${username}?`)) {
      const updatedUsers = users.filter(user => user.username !== username);
      setUsers(updatedUsers);
      localStorage.setItem('usersDB', JSON.stringify(updatedUsers));
      setSuccessMsg(`Usuario ${username} eliminado correctamente.`);
      
      setTimeout(() => {
        setSuccessMsg('');
      }, 3000);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-tungsten text-white mb-6 tracking-wider">
        GESTIÓN DE USUARIOS DEL SISTEMA
      </h2>

      {successMsg && (
        <div className="bg-green-500/20 border border-green-500 p-3 mb-6 clip-corner-sm text-green-400 text-sm font-bold text-center">
          {successMsg}
        </div>
      )}

      <div className="bg-valorant-dark-tertiary p-6 clip-corner-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-valorant-light text-sm">
            <thead className="bg-valorant-dark text-white uppercase font-tungsten text-lg">
              <tr>
                <th className="p-3">Usuario</th>
                <th className="p-3">Rol Actual</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {/* Hardcoded admin */}
              <tr className="border-b border-valorant-dark hover:bg-valorant-dark-secondary">
                <td className="p-3 font-bold text-white">admin <span className="text-xs text-valorant-light ml-2">(Sistema)</span></td>
                <td className="p-3 text-valorant-red font-bold uppercase">admin</td>
                <td className="p-3 text-right text-valorant-light">
                  No modificable
                </td>
              </tr>
              {users.length > 0 ? users.map(u => (
                <tr key={u.username} className="border-b border-valorant-dark hover:bg-valorant-dark-secondary">
                  <td className="p-3 font-bold text-white">{u.username}</td>
                  <td className="p-3 text-valorant-gold font-bold uppercase">{u.role || 'user'}</td>
                  <td className="p-3 flex justify-end items-center gap-2">
                    <select 
                      value={u.role || 'user'}
                      onChange={(e) => handleRoleChange(u.username, e.target.value)}
                      className="bg-valorant-dark border border-valorant-red/30 text-white p-2 font-bold uppercase focus:border-valorant-red focus:outline-none transition-colors"
                    >
                      <option value="user">Usuario normal</option>
                      <option value="coach">Entrenador (Coach)</option>
                      <option value="admin">Administrador</option>
                    </select>
                    <button 
                      onClick={() => handleDeleteUser(u.username)}
                      className="text-valorant-red hover:text-white font-bold uppercase transition-colors px-3 py-2 bg-valorant-dark hover:bg-valorant-red/20 border border-valorant-red/30"
                      title="Eliminar usuario"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="3" className="p-6 text-center text-valorant-light">No hay usuarios registrados adicionales</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
