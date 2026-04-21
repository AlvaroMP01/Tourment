import { useState } from 'react';
import TeamCard from '../components/TeamCard';
import { mockTeams } from '../data/mockData';

const Teams = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [sortBy, setSortBy] = useState('rank');
  const [availability, setAvailability] = useState('all');

  const uniqueRegions = [...new Set(mockTeams.map(t => t.region))];

  const filteredTeams = mockTeams.filter((team) => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          team.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          team.region.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = selectedRegion === 'all' || team.region === selectedRegion;
    const matchesAvailability = availability === 'all' || 
                                (availability === 'available' && team.players.length < 5) || 
                                (availability === 'full' && team.players.length >= 5);
    return matchesSearch && matchesRegion && matchesAvailability;
  });

  const sortedTeams = [...filteredTeams].sort((a, b) => {
    if (sortBy === 'wins') return b.wins - a.wins;
    if (sortBy === 'winrate') {
      const wrA = a.wins / (a.wins + a.losses || 1);
      const wrB = b.wins / (b.wins + b.losses || 1);
      return wrB - wrA;
    }
    return a.rank - b.rank; // default
  });

  return (
    <div className="min-h-screen bg-valorant-dark py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-6xl font-tungsten text-white tracking-wider mb-4">
            EQUIPOS
          </h1>
          <div className="h-1 w-32 bg-valorant-red mb-4"></div>
          <p className="text-valorant-light text-lg">
            Descubre los mejores equipos de VALORANT en España
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Buscar equipos por nombre, tag o región..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-valorant flex-grow"
          />
          <select
            className="bg-valorant-dark border border-valorant-red/30 text-white p-3 font-bold uppercase focus:border-valorant-red focus:outline-none transition-colors"
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
          >
            <option value="all">Todas las Regiones</option>
            {uniqueRegions.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select
            className="bg-valorant-dark border border-valorant-red/30 text-white p-3 font-bold uppercase focus:border-valorant-red focus:outline-none transition-colors"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
          >
            <option value="all">Cualquier Estado</option>
            <option value="available">Buscan Jugadores</option>
            <option value="full">Equipos Completos</option>
          </select>
          <select
            className="bg-valorant-dark border border-valorant-red/30 text-white p-3 font-bold uppercase focus:border-valorant-red focus:outline-none transition-colors"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="rank">Por Ranking</option>
            <option value="wins">Por Victorias</option>
            <option value="winrate">Por Win Rate</option>
          </select>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card-valorant p-6 text-center">
            <div className="text-3xl font-tungsten text-valorant-red mb-2">
              {mockTeams.length}
            </div>
            <div className="text-sm text-valorant-light uppercase">
              Equipos Registrados
            </div>
          </div>
          <div className="card-valorant p-6 text-center">
            <div className="text-3xl font-tungsten text-valorant-red mb-2">
              {mockTeams.reduce((acc, team) => acc + team.players.length, 0)}
            </div>
            <div className="text-sm text-valorant-light uppercase">
              Jugadores Activos
            </div>
          </div>
          <div className="card-valorant p-6 text-center">
            <div className="text-3xl font-tungsten text-valorant-red mb-2">
              {mockTeams.reduce((acc, team) => acc + team.wins, 0)}
            </div>
            <div className="text-sm text-valorant-light uppercase">
              Victorias Totales
            </div>
          </div>
          <div className="card-valorant p-6 text-center">
            <div className="text-3xl font-tungsten text-valorant-red mb-2">
              España
            </div>
            <div className="text-sm text-valorant-light uppercase">
              Región Principal
            </div>
          </div>
        </div>

        {/* Teams Grid */}
        {sortedTeams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedTeams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-tungsten text-white mb-2">
              NO SE ENCONTRARON EQUIPOS
            </h3>
            <p className="text-valorant-light">
              Intenta ajustar tu búsqueda
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Teams;
