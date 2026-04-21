import { useState } from 'react';
import TournamentCard from '../components/TournamentCard';
import { mockTournaments } from '../data/mockData';

const Tournaments = () => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTournaments = mockTournaments.filter((tournament) => {
    const matchesFilter = filter === 'all' || tournament.status === filter;
    const matchesSearch = tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tournament.region.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-valorant-dark py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-6xl font-tungsten text-white tracking-wider mb-4">
            TORNEOS
          </h1>
          <div className="h-1 w-32 bg-valorant-red mb-4"></div>
          <p className="text-valorant-light text-lg">
            Explora y únete a los torneos de VALORANT más competitivos
          </p>
        </div>

        {/* Filters and Search */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Status Filters */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2 font-bold uppercase text-sm clip-corner-sm transition-all ${
                filter === 'all'
                  ? 'bg-valorant-red text-white'
                  : 'bg-valorant-dark-secondary text-valorant-light hover:bg-valorant-dark-tertiary'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter('live')}
              className={`px-6 py-2 font-bold uppercase text-sm clip-corner-sm transition-all ${
                filter === 'live'
                  ? 'bg-valorant-red text-white'
                  : 'bg-valorant-dark-secondary text-valorant-light hover:bg-valorant-dark-tertiary'
              }`}
            >
              En Vivo
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-6 py-2 font-bold uppercase text-sm clip-corner-sm transition-all ${
                filter === 'upcoming'
                  ? 'bg-valorant-red text-white'
                  : 'bg-valorant-dark-secondary text-valorant-light hover:bg-valorant-dark-tertiary'
              }`}
            >
              Próximamente
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-6 py-2 font-bold uppercase text-sm clip-corner-sm transition-all ${
                filter === 'completed'
                  ? 'bg-valorant-red text-white'
                  : 'bg-valorant-dark-secondary text-valorant-light hover:bg-valorant-dark-tertiary'
              }`}
            >
              Finalizados
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Buscar torneos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-valorant w-full md:w-64"
          />
        </div>

        {/* Tournament Grid */}
        {filteredTournaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-tungsten text-white mb-2">
              NO SE ENCONTRARON TORNEOS
            </h3>
            <p className="text-valorant-light">
              Intenta ajustar tus filtros de búsqueda
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tournaments;
