import TeamLogo from './TeamLogo';

const STATUS_LABEL = {
  live: { label: 'EN VIVO', cls: 'text-valorant-red' },
  scheduled: { label: 'PROGRAMADO', cls: 'text-valorant-gold' },
  finished: { label: 'FINALIZADO', cls: 'text-valorant-light' },
};

const safeName = (team) => team?.name || 'Equipo desconocido';
const safeTag = (team) => team?.tag || '';

const MatchCard = ({ match }) => {
  const score1 = match.score1 ?? null;
  const score2 = match.score2 ?? null;
  const status = match.status;
  const meta = STATUS_LABEL[status] || { label: (status || '').toUpperCase(), cls: 'text-valorant-light' };

  const team1 = match.team1 || {};
  const team2 = match.team2 || {};

  const winner1 = status === 'finished' && score1 != null && score2 != null && score1 > score2;
  const winner2 = status === 'finished' && score1 != null && score2 != null && score2 > score1;

  return (
    <div className="card-valorant p-6 hover:scale-105 transition-transform duration-300">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-valorant-light uppercase">{match.round || '—'}</div>
        <div className={`text-sm font-bold uppercase ${meta.cls}`}>
          {status === 'live' && '● '}
          {meta.label}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <TeamLogo path={team1.logo} size="sm" alt={`Logo ${safeName(team1)}`} />
            <div>
              <div className="text-white font-bold">{safeName(team1)}</div>
              <div className="text-xs text-valorant-light">{safeTag(team1)}</div>
            </div>
          </div>
          <div className={`text-3xl font-tungsten ${winner1 ? 'text-valorant-red' : 'text-white'}`}>
            {score1 != null ? score1 : '-'}
          </div>
        </div>

        <div className="relative">
          <div className="divider-glow"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-valorant-dark-secondary px-3">
            <span className="text-valorant-red font-bold text-sm">VS</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <TeamLogo path={team2.logo} size="sm" alt={`Logo ${safeName(team2)}`} />
            <div>
              <div className="text-white font-bold">{safeName(team2)}</div>
              <div className="text-xs text-valorant-light">{safeTag(team2)}</div>
            </div>
          </div>
          <div className={`text-3xl font-tungsten ${winner2 ? 'text-valorant-red' : 'text-white'}`}>
            {score2 != null ? score2 : '-'}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-valorant-dark-tertiary">
        <div className="flex justify-between text-xs text-valorant-light">
          <span className="uppercase">
            Mapa: <span className="text-white font-bold">{match.map || '—'}</span>
          </span>
          <span>
            {match.date
              ? new Date(match.date).toLocaleString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '—'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MatchCard;
