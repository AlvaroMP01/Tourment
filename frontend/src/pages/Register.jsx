import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    const result = register(username, password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Error al crear la cuenta.');
    }
  };

  return (
    <div className="min-h-screen bg-valorant-dark flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="w-16 h-16 bg-valorant-red clip-corner flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl font-bold text-white">V</span>
        </div>
        <h2 className="mt-6 text-center text-5xl font-tungsten text-white tracking-wider">
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
                Usuario
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
              <button
                type="submit"
                className="w-full btn-valorant justify-center"
              >
                CREAR CUENTA
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
