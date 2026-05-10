import { useEffect, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { routesAPI } from '../services/routesAPI';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import TeamLogo from '../components/TeamLogo';

const ROLE_LABELS = {
  admin: 'Admin',
  tournament_manager: 'Tournament Manager',
  player: 'Player',
  coach: 'Coach',
  player_coach: 'Player / Coach',
};

const PublicProfile = () => {
  const { id } = useParams();
  const { user: me } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await routesAPI.getUserProfile(id);
        if (!cancelled) setProfile(data);
      } catch (err) {
        if (cancelled) return;
        if (err.message?.includes('404') || /no encontrad/i.test(err.message || '')) {
          setNotFound(true);
        } else {
          setError(err.message || 'No se pudo cargar el perfil');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id]);

  if (notFound) return <Navigate to="/players" replace />;
  if (loading) {
    return (
      <div className="min-h-screen bg-valorant-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-valorant-red"></div>
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="min-h-screen bg-valorant-dark flex items-center justify-center text-center px-4">
        <div>
          <h2 className="text-3xl font-tungsten text-valorant-red mb-4">Error</h2>
          <p className="text-valorant-light mb-4">{error}</p>
          <Link to="/players" className="btn-valorant inline-block">Volver</Link>
        </div>
      </div>
    );
  }

  const isMe = me?.id === profile.id;
  const displayName = profile.custom_name?.trim() || profile.nickname;
  const hasCustomName = !!profile.custom_name?.trim();
  const stats = profile.stats || {};
  const matches = stats.matches_played || 0;
  const kd = stats.deaths > 0
    ? (stats.kills / stats.deaths)
    : (stats.kills || 0);

  return (
    <div className="min-h-screen bg-valorant-dark py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-valorant-dark-secondary clip-corner-sm border-l-4 border-valorant-red p-6 md:p-10 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10">
            <Avatar path={profile.avatar} size="xl" />

            <div className="flex-1 text-center md:text-left">
              <p className="text-valorant-light text-xs uppercase tracking-widest mb-1">
                {ROLE_LABELS[profile.role] || profile.role}
              </p>
              <h1 className="text-5xl md:text-7xl font-tungsten text-white tracking-wider uppercase break-words">
                {displayName}
              </h1>
              {hasCustomName && (
                <p className="text-valorant-light text-lg mt-1">@{profile.nickname}</p>
              )}

              {profile.team && (
                <Link
                  to={`/teams/${profile.team.team_id}`}
                  className="inline-flex items-center gap-3 mt-4 bg-valorant-dark-tertiary px-4 py-2 clip-corner-sm hover:bg-valorant-dark transition-colors"
                >
                  <TeamLogo path={profile.team.team_logo} size="xs" />
                  <div className="text-left">
                    <div className="text-white font-bold text-sm">
                      {profile.team.team_name} <span className="text-valorant-red">[{profile.team.team_tag}]</span>
                    </div>
                    {profile.team.ingame_role && (
                      <div className="text-valorant-light text-xs">
                        {profile.team.ingame_role}
                        {profile.team.favorite_agent ? ` · ${profile.team.favorite_agent}` : ''}
                      </div>
                    )}
                  </div>
                </Link>
              )}

              {isMe && (
                <div className="mt-6">
                  <Link
                    to="/profile"
                    className="inline-block px-4 py-2 font-bold uppercase text-sm tracking-wider border-2 border-valorant-red text-valorant-red hover:bg-valorant-red hover:text-white transition-all clip-corner-sm"
                  >
                    Editar Perfil
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {profile.bio?.trim() && (
          <div className="card-valorant p-6 mb-8">
            <h2 className="text-sm font-bold uppercase text-valorant-red tracking-wider mb-3">Bio</h2>
            <p className="text-white whitespace-pre-line leading-relaxed">{profile.bio}</p>
          </div>
        )}

        <div>
          <h2 className="text-3xl font-tungsten text-white tracking-wider mb-2">ESTADÍSTICAS</h2>
          <div className="h-1 w-20 bg-valorant-red mb-6"></div>

          {matches === 0 ? (
            <div className="card-valorant p-8 text-center text-valorant-light">
              Sin partidas jugadas todavía
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatBox label="K/D" value={kd.toFixed(2)} highlight />
              <StatBox label="ADR" value={(stats.adr || 0).toFixed(1)} />
              <StatBox label="HS %" value={`${(stats.hs_percentage || 0).toFixed(1)}%`} />
              <StatBox label="Clutches" value={stats.clutches || 0} accent="gold" />
              <StatBox label="Kills" value={stats.kills || 0} />
              <StatBox label="Deaths" value={stats.deaths || 0} />
              <StatBox label="Assists" value={stats.assists || 0} />
              <StatBox label="Partidas" value={matches} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatBox = ({ label, value, highlight = false, accent }) => {
  const valueClass = highlight
    ? 'text-valorant-red'
    : accent === 'gold'
    ? 'text-valorant-gold'
    : 'text-white';
  return (
    <div className="card-valorant p-4 text-center">
      <div className="text-xs text-valorant-light uppercase tracking-widest mb-1">{label}</div>
      <div className={`text-3xl font-tungsten ${valueClass}`}>{value}</div>
    </div>
  );
};

export default PublicProfile;
