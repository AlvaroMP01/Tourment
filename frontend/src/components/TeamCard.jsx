import { Link } from 'react-router-dom';

const TeamCard = ({ team }) => {
  const allMembers = [...team.players];
  const isLeaderInPlayers = team.players.some(p => p.name === team.leader);
  if (team.leader && !isLeaderInPlayers) {
    allMembers.unshift({ id: 'leader', name: team.leader, teamRole: 'coach', isLeader: true });
  }

  return (
    <Link to={`/teams/${team.id}`} className="block">
      <div className="card-valorant p-6 group hover:scale-105 transition-transform duration-300">
        {/* Team Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          {/* Team Logo */}
          <div className="w-16 h-16 bg-valorant-dark-tertiary clip-corner flex items-center justify-center text-3xl group-hover:animate-glow overflow-hidden">
            {team.logo && team.logo.startsWith('http') ? (
               <img src={team.logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
               team.logo
            )}
          </div>
          
          {/* Team Name */}
          <div>
            <h3 className="text-2xl font-tungsten text-white tracking-wider">
              {team.name}
            </h3>
            <p className="text-valorant-red font-bold">{team.tag}</p>
          </div>
        </div>

        {/* Rank Badge */}
        <div className="bg-valorant-red clip-corner-sm px-4 py-2">
          <div className="text-xs text-white opacity-70">RANK</div>
          <div className="text-2xl font-tungsten text-white">#{team.rank}</div>
        </div>
      </div>

      <div className="divider-glow mb-4"></div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-tungsten text-valorant-red">{team.wins}</div>
          <div className="text-xs text-valorant-light uppercase">Victorias</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-tungsten text-white">{team.losses}</div>
          <div className="text-xs text-valorant-light uppercase">Derrotas</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-tungsten text-valorant-gold">
            {((team.wins / (team.wins + team.losses)) * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-valorant-light uppercase">Winrate</div>
        </div>
      </div>

      {/* Players */}
      <div className="bg-valorant-dark-tertiary p-4 clip-corner-sm">
        <div className="text-xs text-valorant-light uppercase mb-2">Roster</div>
        <div className="space-y-2">
          {allMembers.slice(0, 3).map((player) => {
            const isCoachOnly = player.teamRole === 'coach';
            const isBoth = player.teamRole === 'both';
            const roleText = isCoachOnly ? 'Coach' : isBoth ? 'Jug/Coach' : 'Jugador';
            const textColor = isCoachOnly ? 'text-valorant-gold' : isBoth ? 'text-blue-400' : 'text-white';
            const badgeColor = isCoachOnly ? 'border-valorant-gold text-valorant-gold' : isBoth ? 'border-blue-400 text-blue-400' : 'border-valorant-light opacity-50 text-valorant-light';

            return (
              <div key={player.id} className="flex justify-between items-center text-sm bg-valorant-dark/50 p-1.5 rounded">
                <span className={`${textColor} font-bold truncate pr-2`}>{player.name}</span>
                <div className="flex gap-2 items-center shrink-0">
                  <span className={`text-[9px] px-1 border uppercase font-bold ${badgeColor}`}>
                    {roleText}
                  </span>
                  {player.agent && <span className="text-valorant-light opacity-70 text-xs w-12 text-right">{player.agent}</span>}
                </div>
              </div>
            );
          })}
          {allMembers.length > 3 && (
            <div className="text-xs text-valorant-red text-center pt-2 font-bold uppercase">
              +{allMembers.length - 3} más
            </div>
          )}
        </div>
      </div>

      {/* Region */}
      <div className="mt-4 text-center">
        <span className="text-xs text-valorant-light uppercase">{team.region}</span>
      </div>
    </div>
    </Link>
  );
};

export default TeamCard;
