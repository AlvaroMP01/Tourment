import { Link } from 'react-router-dom';

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

  return (
    <Link to={`/tournaments/${tournament.id}`} className="block group">
      <div className="card-valorant overflow-hidden h-full transition-transform duration-300 group-hover:scale-105">
        {/* Cover sintético: gradiente con el nombre. El modelo no guarda imagen. */}
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-valorant-dark via-valorant-dark-secondary to-valorant-red/40">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-tungsten text-white/20 tracking-widest uppercase text-center px-4">
              {tournament.name}
            </span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-valorant-dark via-transparent to-transparent"></div>

          {badge && (
            <div className="absolute top-4 right-4">
              <span className={badge.className}>{badge.label}</span>
            </div>
          )}
        </div>

        {/* Tournament Info */}
        <div className="p-6">
          <h3 className="text-2xl font-tungsten text-white mb-2 tracking-wider">
            {tournament.name}
          </h3>

          <div className="divider-glow mb-4"></div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-valorant-light opacity-70 uppercase text-xs mb-1">Inicio</div>
              <div className="text-white font-bold">{formatDate(startDate)}</div>
            </div>
            <div>
              <div className="text-valorant-light opacity-70 uppercase text-xs mb-1">Fin</div>
              <div className="text-white font-bold">{formatDate(endDate)}</div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default TournamentCard;
