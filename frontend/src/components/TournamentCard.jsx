import { Link } from 'react-router-dom';

const TournamentCard = ({ tournament }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'live':
        return <span className="badge-live">● EN VIVO</span>;
      case 'upcoming':
        return <span className="badge-upcoming">PRÓXIMAMENTE</span>;
      case 'completed':
        return <span className="badge-completed">FINALIZADO</span>;
      default:
        return null;
    }
  };

  return (
    <Link to={`/tournaments/${tournament.id}`} className="block group">
      <div className="card-valorant overflow-hidden h-full transition-transform duration-300 group-hover:scale-105">
        {/* Tournament Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={tournament.image}
            alt={tournament.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-valorant-dark via-transparent to-transparent"></div>
          
          {/* Status Badge */}
          <div className="absolute top-4 right-4">
            {getStatusBadge(tournament.status)}
          </div>

          {/* Region Badge */}
          <div className="absolute top-4 left-4 bg-valorant-dark-secondary px-3 py-1 text-xs font-bold uppercase text-valorant-light">
            {tournament.region}
          </div>
        </div>

        {/* Tournament Info */}
        <div className="p-6">
          <h3 className="text-2xl font-tungsten text-white mb-2 tracking-wider">
            {tournament.name}
          </h3>
          
          <p className="text-valorant-light text-sm mb-4 line-clamp-2">
            {tournament.description}
          </p>

          <div className="divider-glow mb-4"></div>

          {/* Tournament Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-valorant-light opacity-70 uppercase text-xs mb-1">
                Premio
              </div>
              <div className="text-valorant-red font-bold text-lg">
                {tournament.prize}
              </div>
            </div>
            <div>
              <div className="text-valorant-light opacity-70 uppercase text-xs mb-1">
                Equipos
              </div>
              <div className="text-white font-bold text-lg">
                {tournament.teams}
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="mt-4 pt-4 border-t border-valorant-dark-tertiary">
            <div className="flex justify-between text-xs text-valorant-light">
              <span>Inicio: {new Date(tournament.startDate).toLocaleDateString('es-ES')}</span>
              <span>Fin: {new Date(tournament.endDate).toLocaleDateString('es-ES')}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default TournamentCard;
