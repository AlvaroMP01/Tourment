const MatchCard = ({ match }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'live':
        return 'text-valorant-red';
      case 'upcoming':
        return 'text-valorant-gold';
      case 'completed':
        return 'text-valorant-light';
      default:
        return 'text-valorant-light';
    }
  };

  return (
    <div className="card-valorant p-6 hover:scale-105 transition-transform duration-300">
      {/* Match Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-valorant-light uppercase">{match.round}</div>
        <div className={`text-sm font-bold uppercase ${getStatusColor(match.status)}`}>
          {match.status === 'live' && '● '}
          {match.status.toUpperCase()}
        </div>
      </div>

      {/* Teams */}
      <div className="space-y-4">
        {/* Team 1 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <div className="w-10 h-10 bg-valorant-dark-tertiary clip-corner-sm flex items-center justify-center text-xl overflow-hidden shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]">
              {match.team1.logo && match.team1.logo.startsWith('http') ? (
                 <img src={match.team1.logo} alt="Logo 1" className="w-full h-full object-cover" />
              ) : (
                 match.team1.logo
              )}
            </div>
            <div>
              <div className="text-white font-bold">{match.team1.name}</div>
              <div className="text-xs text-valorant-light">{match.team1.tag}</div>
            </div>
          </div>
          <div className={`text-3xl font-tungsten ${match.score1 > match.score2 && match.status === 'completed' ? 'text-valorant-red' : 'text-white'}`}>
            {match.score1 !== null ? match.score1 : '-'}
          </div>
        </div>

        {/* VS Divider */}
        <div className="relative">
          <div className="divider-glow"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-valorant-dark-secondary px-3">
            <span className="text-valorant-red font-bold text-sm">VS</span>
          </div>
        </div>

        {/* Team 2 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <div className="w-10 h-10 bg-valorant-dark-tertiary clip-corner-sm flex items-center justify-center text-xl overflow-hidden shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]">
              {match.team2.logo && match.team2.logo.startsWith('http') ? (
                 <img src={match.team2.logo} alt="Logo 2" className="w-full h-full object-cover" />
              ) : (
                 match.team2.logo
              )}
            </div>
            <div>
              <div className="text-white font-bold">{match.team2.name}</div>
              <div className="text-xs text-valorant-light">{match.team2.tag}</div>
            </div>
          </div>
          <div className={`text-3xl font-tungsten ${match.score2 > match.score1 && match.status === 'completed' ? 'text-valorant-red' : 'text-white'}`}>
            {match.score2 !== null ? match.score2 : '-'}
          </div>
        </div>
      </div>

      {/* Match Details */}
      <div className="mt-4 pt-4 border-t border-valorant-dark-tertiary">
        <div className="flex justify-between text-xs text-valorant-light">
          <span className="uppercase">Mapa: <span className="text-white font-bold">{match.map}</span></span>
          <span>{new Date(match.date).toLocaleString('es-ES', { 
            day: '2-digit', 
            month: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit' 
          })}</span>
        </div>
      </div>
    </div>
  );
};

export default MatchCard;
