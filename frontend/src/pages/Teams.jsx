import { useState, useEffect, useMemo } from 'react';
import { routesAPI } from '../services/routesAPI';
import TeamCard from '../components/TeamCard';

const SORT_OPTIONS = [
  { value: 'wins', label: 'Victorias' },
  { value: 'name', label: 'Nombre' },
  { value: 'members', label: 'Miembros' },
];

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [availability, setAvailability] = useState('all');
  const [sortBy, setSortBy] = useState('wins');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await routesAPI.getTeams({ sort_by: sortBy });
        if (!cancelled) setTeams(data || []);
      } catch (err) {
        if (!cancelled) setError(err.message || 'No se pudieron cargar los equipos');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [sortBy]);

  const uniqueRegions = useMemo(
    () => [...new Set(teams.map(t => t.region).filter(Boolean))],
    [teams]
  );

  // El backend ya viene ordenado. Asignamos rank visual y filtramos en cliente.
  const ranked = useMemo(
    () => teams.map((t, idx) => ({ ...t, rank: idx + 1 })),
    [teams]
  );

  const filtered = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return ranked.filter(team => {
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
  }, [ranked, searchTerm, selectedRegion, availability]);

  const totalMembers = teams.reduce((acc, t) => acc + (t.member_count ?? 0), 0);
  const totalMatches = teams.reduce((acc, t) => acc + (t.matches_played ?? 0), 0);

  // Podio solo si el sort es wins (es el "ranking" verdadero).
  const showPodium = sortBy === 'wins' && filtered.length > 0;
  const podium = showPodium ? filtered.filter(t => t.rank <= 3 && (t.wins ?? 0) > 0) : [];
  const podiumIds = new Set(podium.map(t => t.id));
  const restTeams = showPodium ? filtered.filter(t => !podiumIds.has(t.id)) : filtered;

  if (loading) {
    return (
      <div className="min-h-screen bg-valorant-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-valorant-red"></div>
      </div>
    );
  }

  const heroTitle = sortBy === 'wins' ? 'TOP EQUIPOS POR VICTORIAS' : 'EQUIPOS';

  return (
    <div className="min-h-screen bg-valorant-dark py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl md:text-6xl font-tungsten text-white tracking-wider mb-4">{heroTitle}</h1>
          <div className="h-1 w-32 bg-valorant-red mb-4"></div>
          <p className="text-valorant-light text-lg">
            {sortBy === 'wins'
              ? 'Ranking según victorias en partidas finalizadas.'
              : 'Descubre los equipos de la plataforma.'}
          </p>
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
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>Ordenar: {o.label}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card-valorant p-6 text-center">
            <div className="text-3xl font-tungsten text-valorant-red mb-2">{teams.length}</div>
            <div className="text-sm text-valorant-light uppercase">Equipos</div>
          </div>
          <div className="card-valorant p-6 text-center">
            <div className="text-3xl font-tungsten text-valorant-red mb-2">{totalMembers}</div>
            <div className="text-sm text-valorant-light uppercase">Miembros</div>
          </div>
          <div className="card-valorant p-6 text-center">
            <div className="text-3xl font-tungsten text-valorant-red mb-2">{totalMatches}</div>
            <div className="text-sm text-valorant-light uppercase">Partidas Jugadas</div>
          </div>
          <div className="card-valorant p-6 text-center">
            <div className="text-3xl font-tungsten text-valorant-red mb-2">{uniqueRegions.length}</div>
            <div className="text-sm text-valorant-light uppercase">Regiones</div>
          </div>
        </div>

        {/* Podio top-3 (solo cuando sort=wins y hay equipos con victorias) */}
        {podium.length > 0 && (
          <>
            <h2 className="text-2xl font-tungsten text-white tracking-wider mb-4">PODIO</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {podium.map((team) => (
                <TeamCard key={team.id} team={team} rank={team.rank} highlightMetric="wins" />
              ))}
            </div>
          </>
        )}

        {restTeams.length > 0 ? (
          <>
            {podium.length > 0 && (
              <h2 className="text-2xl font-tungsten text-white tracking-wider mb-4">RESTO DE LA TABLA</h2>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restTeams.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  rank={sortBy === 'wins' ? team.rank : undefined}
                  highlightMetric={sortBy === 'wins' ? 'wins' : undefined}
                />
              ))}
            </div>
          </>
        ) : podium.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-tungsten text-white mb-2">NO SE ENCONTRARON EQUIPOS</h3>
            <p className="text-valorant-light">Intenta ajustar tu búsqueda</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Teams;
