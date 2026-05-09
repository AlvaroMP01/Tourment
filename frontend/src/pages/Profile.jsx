import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { routesAPI } from '../services/routesAPI';
import { userAdapter } from '../services/adapters';
import Avatar from '../components/Avatar';
import ImageUploader from '../components/ImageUploader';

const Profile = () => {
  const { user, token, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const [formData, setFormData] = useState({
    custom_name: '',
    bio: '',
  });
  const [avatarPath, setAvatarPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        try {
          const rawData = await routesAPI.getMe(token);
          const adaptedUser = userAdapter(rawData);
          setFormData({
            custom_name: adaptedUser.customName,
            bio: adaptedUser.bio,
          });
          setAvatarPath(adaptedUser.avatar || null);
        } catch (err) {
          console.error("Error cargando datos de perfil:", err);
          setError("No se pudieron cargar tus datos.");
        }
      }
      setLoading(false);
    };

    loadUserData();
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await routesAPI.updateMe(formData);
      setSuccess('¡Perfil actualizado con éxito!');
    } catch (err) {
      setError(err.message || 'Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadAvatar = async (file) => {
    const data = await routesAPI.uploadAvatar(file);
    setAvatarPath(data.avatar);
    await refreshUser();
  };

  const handleDeleteAvatar = async () => {
    await routesAPI.deleteAvatar();
    setAvatarPath(null);
    await refreshUser();
  };

  if (loading) return <div className="min-h-screen bg-valorant-dark flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-valorant-red"></div></div>;

  return (
    <div className="min-h-screen bg-valorant-dark text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-tungsten mb-8 tracking-wider text-center">MI PERFIL</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <div className="card-valorant p-6 text-center">
              <div className="flex justify-center mb-4">
                <Avatar path={avatarPath} size="lg" />
              </div>
              <h3 className="text-2xl font-tungsten">{user?.nickname}</h3>
              <p className="text-valorant-light text-sm uppercase tracking-widest">{user?.role}</p>
            </div>

            <div className="card-valorant p-6 mt-6">
              <h4 className="font-bold uppercase text-valorant-red mb-4">Estadísticas</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Kills</span> <span>{user?.stats?.kills || 0}</span></div>
                <div className="flex justify-between"><span>Deaths</span> <span>{user?.stats?.deaths || 0}</span></div>
                <div className="flex justify-between"><span>Assists</span> <span>{user?.stats?.assists || 0}</span></div>
                <div className="flex justify-between"><span>ADR</span> <span>{user?.stats?.adr || 0}</span></div>
                <div className="flex justify-between"><span>HS %</span> <span>{user?.stats?.hs_percentage || 0}%</span></div>
                <div className="flex justify-between"><span>Clutches</span> <span>{user?.stats?.clutches || 0}</span></div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full mt-6 px-4 py-3 font-bold uppercase text-sm tracking-wider border-2 border-valorant-red text-valorant-red hover:bg-valorant-red hover:text-white transition-all duration-300 clip-corner-sm"
            >
              Cerrar Sesión
            </button>
          </div>

          <div className="md:col-span-2">
            <div className="card-valorant p-8">
              <h3 className="text-2xl font-tungsten mb-6">Editar Información</h3>

              {error && <div className="bg-red-500/20 border border-valorant-red p-3 mb-4 text-sm text-center">{error}</div>}
              {success && <div className="bg-green-500/20 border border-green-500 p-3 mb-4 text-sm text-center">{success}</div>}

              <div className="mb-8">
                <label className="block text-sm font-bold uppercase text-valorant-light mb-3">Avatar</label>
                <ImageUploader
                  currentPath={avatarPath}
                  onUpload={handleUploadAvatar}
                  onDelete={handleDeleteAvatar}
                  placeholder="avatar"
                  label="Subir Avatar"
                />
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold uppercase text-valorant-light mb-2">Nombre Visible</label>
                  <input
                    type="text"
                    name="custom_name"
                    value={formData.custom_name}
                    onChange={handleChange}
                    className="w-full bg-valorant-dark-secondary border border-valorant-dark-tertiary focus:border-valorant-red outline-none p-3 text-white transition-colors clip-corner-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase text-valorant-light mb-2">Bio</label>
                  <textarea
                    name="bio"
                    rows="4"
                    value={formData.bio}
                    onChange={handleChange}
                    className="w-full bg-valorant-dark-secondary border border-valorant-dark-tertiary focus:border-valorant-red outline-none p-3 text-white transition-colors clip-corner-sm resize-none"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className={`w-full btn-valorant ${saving ? 'opacity-50' : ''}`}
                >
                  {saving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
