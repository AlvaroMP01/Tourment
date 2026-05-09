import { Link } from 'react-router-dom';
import TeamLogo from './TeamLogo';

const RANK_COLORS = {
  1: { border: 'border-valorant-gold', text: 'text-valorant-gold', glow: 'shadow-[0_0_30px_rgba(255,184,28,0.25)]' },
  2: { border: 'border-gray-400', text: 'text-gray-400', glow: '' },
  3: { border: 'border-orange-700', text: 'text-orange-600', glow: '' },
};

const TeamCard = ({ team, rank, highlightMetric }) => {
  const memberCount = team.member_count ?? 0;
  const isFull = memberCount >= 7;
  const isAvailable = memberCount < 7;
  const wins = team.wins ?? 0;
  const losses = team.losses ?? 0;
  const matches = team.matches_played ?? 0;
  const winRate = matches > 0 ? Math.round((wins / matches) * 100) : 0;
  const showRecord = team.wins !== undefined;
  const podium = rank && rank <= 3 ? RANK_COLORS[rank] : null;

  return (
    <Link to={`/teams/${team.id}`} className="block">
      <div
        className={`card-valorant p-6 group hover:scale-105 transition-transform duration-300 ${
          podium ? `border-t-4 ${podium.border} ${podium.glow}` : ''
        }`}
      >
        {rank && (
          <div className="flex items-center justify-between mb-3">
            <span className={`text-4xl font-tungsten ${podium ? podium.text : 'text-white'}`}>
              #{rank}
            </span>
            {highlightMetric === 'wins' && showRecord && (
              <div className="text-right">
                <div className="text-xs text-valorant-light uppercase">Victorias</div>
                <div className="text-3xl font-tungsten text-valorant-red">{wins}</div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <TeamLogo path={team.logo} size="md" className="group-hover:animate-glow" />
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

        <div className="bg-valorant-dark-tertiary p-4 clip-corner-sm space-y-2">
          {showRecord && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-valorant-light uppercase text-xs">Record (W-L)</span>
              <span className="font-bold">
                <span className="text-green-400">{wins}</span>
                <span className="text-valorant-light"> - </span>
                <span className="text-valorant-red">{losses}</span>
                {matches > 0 && (
                  <span className="text-valorant-light text-xs ml-2">({winRate}%)</span>
                )}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm">
            <span className="text-valorant-light uppercase text-xs">Región</span>
            <span className="text-white font-bold">{team.region || '—'}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
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
