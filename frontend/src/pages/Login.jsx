import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ nickname, password });
      navigate('/');
    } catch (err) {
      setError(err.error || err.message || 'Credenciales incorrectas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-valorant-dark flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="w-20 h-20 flex items-center justify-center mx-auto mb-4">
          <img
            src="/favicon.png"
            alt="Tourment logo"
            className="w-full h-full object-contain"
          />
        </div>
        <h2 className="mt-6 text-center text-3xl md:text-5xl font-tungsten text-white tracking-wider">
          INICIAR SESIÓN
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
              <button
                type="submit"
                disabled={loading}
                className={`w-full btn-valorant justify-center ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'ENTRANDO...' : 'ENTRAR'}
              </button>
            </div>
            
            <div className="text-center mt-4">
              <span className="text-valorant-light text-sm">¿No tienes cuenta? </span>
              <Link to="/register" className="text-valorant-red font-bold hover:text-white transition-colors">
                Regístrate aquí
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
