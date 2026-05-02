import { Link } from 'react-router-dom';

const TeamCard = ({ team }) => {
  const memberCount = team.member_count ?? 0;
  const isFull = memberCount >= 7;
  const isAvailable = memberCount < 7;

  return (
    <Link to={`/teams/${team.id}`} className="block">
      <div className="card-valorant p-6 group hover:scale-105 transition-transform duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-valorant-dark-tertiary clip-corner flex items-center justify-center text-3xl group-hover:animate-glow overflow-hidden">
              {team.logo && team.logo.startsWith('http') ? (
                <img src={team.logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                team.logo || '🎮'
              )}
            </div>
            <div>
              <h3 className="text-2xl font-tungsten text-white tracking-wider">{team.name}</h3>
              <p className="text-valorant-red font-bold">[{team.tag}]</p>
            </div>
          </div>

          <div className={`clip-corner-sm px-4 py-2 ${isFull ? 'bg-valorant-dark-tertiary border border-valorant-red' : 'bg-green-700/30 border border-green-500'}`}>
            <div className="text-xs text-white opacity-70 uppercase">{isFull ? 'Completo' : 'Reclutando'}</div>
            <div className="text-2xl font-tungsten text-white">{memberCount}/7</div>
          </div>
        </div>

        <div className="divider-glow mb-4"></div>

        <div className="bg-valorant-dark-tertiary p-4 clip-corner-sm">
          <div className="flex justify-between items-center text-sm">
            <span className="text-valorant-light uppercase text-xs">Región</span>
            <span className="text-white font-bold">{team.region || '—'}</span>
          </div>
          <div className="flex justify-between items-center text-sm mt-2">
            <span className="text-valorant-light uppercase text-xs">Plazas Libres</span>
            <span className={`font-bold ${isAvailable ? 'text-green-400' : 'text-valorant-red'}`}>
              {Math.max(0, 7 - memberCount)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default TeamCard;
