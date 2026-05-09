import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRol] = useState('player');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      setLoading(false);
      return;
    }

    try {
      await register({ nickname, password, role });
      // Si el registro es exitoso, mandamos al usuario al login
      navigate('/login');
    } catch (err) {
      // El error viene de routesAPI.register (error.message o error.error)
      setError(err.error || err.message || 'Error al crear la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-valorant-dark flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="w-16 h-16 bg-valorant-red clip-corner flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl font-bold text-white">V</span>
        </div>
        <h2 className="mt-6 text-center text-3xl md:text-5xl font-tungsten text-white tracking-wider">
          REGÍSTRATE
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card-valorant py-8 px-4 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/20 border border-valorant-red p-3 clip-corner-sm text-valorant-light text-sm text-center">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-bold uppercase text-valorant-light mb-2">
                Nickname
              </label>
              <input
                type="text"
                required
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full bg-valorant-dark-secondary border border-valorant-dark-tertiary focus:border-valorant-red outline-none p-3 text-white transition-colors clip-corner-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-bold uppercase text-valorant-light mb-2">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-valorant-dark-secondary border border-valorant-dark-tertiary focus:border-valorant-red outline-none p-3 text-white transition-colors clip-corner-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold uppercase text-valorant-light mb-2">
                Repetir Contraseña
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-valorant-dark-secondary border border-valorant-dark-tertiary focus:border-valorant-red outline-none p-3 text-white transition-colors clip-corner-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-bold uppercase text-valorant-light mb-2">
                Tu role Inicial
              </label>
              <select
                value={role}
                onChange={(e) => setRol(e.target.value)}
                className="w-full bg-valorant-dark-secondary border border-valorant-dark-tertiary focus:border-valorant-red outline-none p-3 text-white transition-colors clip-corner-sm"
              >
                <option value="player">Jugador (Puede unirse a equipos)</option>
                <option value="coach">Coach (Crea su propio equipo)</option>
                <option value="player_coach">Jugador/Coach (Crea su equipo y juega en él)</option>
              </select>
              <p className="text-[10px] text-valorant-light mt-2 uppercase opacity-70">
                * Los roles de Coach y Player/Coach no podrán unirse a otros equipos.
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full btn-valorant justify-center ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'CREANDO...' : 'CREAR CUENTA'}
              </button>
            </div>
            
            <div className="text-center mt-4">
              <span className="text-valorant-light text-sm">¿Ya tienes cuenta? </span>
              <Link to="/login" className="text-valorant-red font-bold hover:text-white transition-colors">
                Inicia sesión aquí
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;

