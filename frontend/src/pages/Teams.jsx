import { useState, useEffect, useMemo } from 'react';
import { routesAPI } from '../services/routesAPI';
import TeamCard from '../components/TeamCard';

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [availability, setAvailability] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await routesAPI.getTeams();
        setTeams(data);
      } catch (err) {
        setError(err.message || 'No se pudieron cargar los equipos');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const uniqueRegions = useMemo(
    () => [...new Set(teams.map(t => t.region).filter(Boolean))],
    [teams]
  );

  const filteredTeams = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return teams.filter(team => {
      const matchesSearch =
        team.name.toLowerCase().includes(search) ||
        (team.tag || '').toLowerCase().includes(search) ||
        (team.region || '').toLowerCase().includes(search);
      const matchesRegion = selectedRegion === 'all' || team.region === selectedRegion;
      const memberCount = team.member_count ?? 0;
      const matchesAvailability =
        availability === 'all' ||
        (availability === 'available' && memberCount < 7) ||
        (availability === 'full' && memberCount >= 7);
      return matchesSearch && matchesRegion && matchesAvailability;
    });
  }, [teams, searchTerm, selectedRegion, availability]);

  const sortedTeams = useMemo(() => {
    const arr = [...filteredTeams];
    if (sortBy === 'members') {
      arr.sort((a, b) => (b.member_count ?? 0) - (a.member_count ?? 0));
    } else {
      arr.sort((a, b) => a.name.localeCompare(b.name));
    }
    return arr;
  }, [filteredTeams, sortBy]);

  const totalMembers = teams.reduce((acc, t) => acc + (t.member_count ?? 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-valorant-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-valorant-red"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-valorant-dark py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-6xl font-tungsten text-white tracking-wider mb-4">EQUIPOS</h1>
          <div className="h-1 w-32 bg-valorant-red mb-4"></div>
          <p className="text-valorant-light text-lg">Descubre los equipos de la plataforma</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-valorant-red p-4 mb-6 text-center text-red-400">
            {error}
          </div>
        )}

        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Buscar por nombre, tag o región..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow bg-valorant-dark-secondary border border-valorant-dark focus:border-valorant-red outline-none p-3 text-white"
          />
          <select
            className="bg-valorant-dark border border-valorant-red/30 text-white p-3 font-bold uppercase focus:border-valorant-red focus:outline-none transition-colors"
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
          >
            <option value="all">Todas las Regiones</option>
            {uniqueRegions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select
            className="bg-valorant-dark border border-valorant-red/30 text-white p-3 font-bold uppercase focus:border-valorant-red focus:outline-none transition-colors"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
          >
            <option value="all">Cualquier Estado</option>
            <option value="available">Reclutando</option>
            <option value="full">Completos</option>
          </select>
          <select
            className="bg-valorant-dark border border-valorant-red/30 text-white p-3 font-bold uppercase focus:border-valorant-red focus:outline-none transition-colors"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name">Por Nombre</option>
            <option value="members">Por Miembros</option>
          </select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="card-valorant p-6 text-center">
            <div className="text-3xl font-tungsten text-valorant-red mb-2">{teams.length}</div>
            <div className="text-sm text-valorant-light uppercase">Equipos Registrados</div>
          </div>
          <div className="card-valorant p-6 text-center">
            <div className="text-3xl font-tungsten text-valorant-red mb-2">{totalMembers}</div>
            <div className="text-sm text-valorant-light uppercase">Miembros Activos</div>
          </div>
          <div className="card-valorant p-6 text-center">
            <div className="text-3xl font-tungsten text-valorant-red mb-2">{uniqueRegions.length}</div>
            <div className="text-sm text-valorant-light uppercase">Regiones</div>
          </div>
        </div>

        {sortedTeams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedTeams.map((team) => <TeamCard key={team.id} team={team} />)}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-tungsten text-white mb-2">NO SE ENCONTRARON EQUIPOS</h3>
            <p className="text-valorant-light">Intenta ajustar tu búsqueda</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Teams;
