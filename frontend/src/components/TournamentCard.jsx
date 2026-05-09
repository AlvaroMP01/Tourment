import { Link } from 'react-router-dom';
import { formatPrize } from '../services/adapters';
import TournamentImage from './TournamentImage';

const STATUS_BADGE = {
  live: { className: 'badge-live', label: '● EN VIVO' },
  upcoming: { className: 'badge-upcoming', label: 'PRÓXIMAMENTE' },
  finished: { className: 'badge-completed', label: 'FINALIZADO' },
};

const formatDate = (raw) => {
  if (!raw) return '—';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-ES');
};

const TournamentCard = ({ tournament }) => {
  // El adapter expone startDate/endDate; el endpoint crudo usa start_date/end_date.
  // Aceptamos ambas para que el componente sirva en cualquier caller.
  const startDate = tournament.startDate || tournament.start_date;
  const endDate = tournament.endDate || tournament.end_date;
  const status = tournament.status;
  const badge = STATUS_BADGE[status] || null;
  const { image, description, name } = tournament;

  // Prize: el adapter expone prizeAmount/prizeCurrency + prize formateado;
  // el endpoint crudo expone prize_amount + prize_currency. Aceptamos ambas.
  const prizeAmount = tournament.prizeAmount ?? tournament.prize_amount ?? null;
  const prizeCurrency = tournament.prizeCurrency || tournament.prize_currency || null;
  const hasPrize = prizeAmount != null && Number(prizeAmount) > 0;
  const prizeText = tournament.prize || formatPrize(prizeAmount, prizeCurrency);

  const teamsCount = tournament.acceptedTeamsCount ?? tournament.accepted_teams_count ?? null;

  return (
    <Link to={`/tournaments/${tournament.id}`} className="block group">
      <div className="card-valorant overflow-hidden h-full transition-transform duration-300 group-hover:scale-105">
        <div className="relative h-48 overflow-hidden">
          <TournamentImage path={image} name={name} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-valorant-dark via-transparent to-transparent"></div>

          {badge && (
            <div className="absolute top-4 right-4">
              <span className={badge.className}>{badge.label}</span>
            </div>
          )}

          {teamsCount != null && (
            <div className="absolute top-4 left-4 bg-valorant-dark/80 border border-valorant-red px-3 py-1 clip-corner-sm flex items-center gap-1.5 text-xs font-bold uppercase text-white">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-5.13a4 4 0 11-8 0 4 4 0 018 0zm6 3a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{teamsCount} {teamsCount === 1 ? 'equipo' : 'equipos'}</span>
            </div>
          )}
        </div>

        {/* Tournament Info */}
        <div className="p-6">
          <h3 className="text-2xl font-tungsten text-white mb-2 tracking-wider">
            {tournament.name}
          </h3>

          {description && (
            <p className="text-valorant-light text-sm mb-4 line-clamp-2">{description}</p>
          )}

          <div className="divider-glow mb-4"></div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            {hasPrize ? (
              <div>
                <div className="text-valorant-light opacity-70 uppercase text-xs mb-1">Premio</div>
                <div className="text-valorant-red font-bold text-lg">{prizeText}</div>
              </div>
            ) : (
              <div>
                <div className="text-valorant-light opacity-70 uppercase text-xs mb-1">Inicio</div>
                <div className="text-white font-bold">{formatDate(startDate)}</div>
              </div>
            )}
            <div>
              <div className="text-valorant-light opacity-70 uppercase text-xs mb-1">
                {hasPrize ? 'Inicio' : 'Fin'}
              </div>
              <div className="text-white font-bold">
                {formatDate(hasPrize ? startDate : endDate)}
              </div>
            </div>
          </div>

          {hasPrize && (
            <div className="mt-3 pt-3 border-t border-valorant-dark-tertiary text-xs text-valorant-light flex justify-between">
              <span>Fin:</span>
              <span className="text-white font-bold">{formatDate(endDate)}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default TournamentCard;
