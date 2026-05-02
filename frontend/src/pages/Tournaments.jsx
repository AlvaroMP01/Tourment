import { useState, useEffect } from 'react';
import { routesAPI } from '../services/routesAPI';
import { tournamentAdapter } from '../services/adapters';
import TournamentCard from '../components/TournamentCard';
import LoadingSpinner from '../components/LoadingSpinner';

const Tournaments = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const data = await routesAPI.getTournaments();
        // Transform raw API data using the adapter
        const adaptedTournaments = data.map(tournamentAdapter);
        setTournaments(adaptedTournaments);
      } catch (err) {
        console.error('Error fetching tournaments:', err);
        setError('No se pudieron cargar los torneos.');
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  if (loading) return <div className="min-h-screen bg-valorant-dark flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-valorant-red"></div></div>;

  return (
    <div className="min-h-screen bg-valorant-dark text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-tungsten mb-8 tracking-wider text-center">
          TORNEOS DISPONIBLES
        </h2>

        {error && (
          <div className="bg-red-500/20 border border-valorant-red p-4 mb-6 text-center text-red-400">
            {error}
          </div>
        )}

        {tournaments.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-valorant-light text-xl">No hay torneos disponibles en este momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tournaments;

