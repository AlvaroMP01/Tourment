import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import MatchCard from '../components/MatchCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { mockTournaments, mockMatches, mockBracket } from '../data/mockData';

const TournamentDetail = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  
  const tournament = mockTournaments.find(t => t.id === parseInt(id));
  const tournamentMatches = mockMatches.filter(m => m.tournamentId === parseInt(id));

  if (!tournament) {
    return (
      <div className="min-h-screen bg-valorant-dark flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-4xl font-tungsten text-white mb-4">
            TORNEO NO ENCONTRADO
          </h2>
          <a href="/tournaments" className="btn-valorant">
            Volver a Torneos
          </a>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Resumen' },
    { id: 'matches', name: 'Partidos' },
    { id: 'bracket', name: 'Bracket' },
  ];

  return (
    <div className="min-h-screen bg-valorant-dark">
      {/* Tournament Header */}
      <div className="relative h-96 overflow-hidden">
        <img
          src={tournament.image}
          alt={tournament.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-valorant-dark via-valorant-dark/80 to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
              <span className="badge-{tournament.status}">
                {tournament.status === 'live' && '● EN VIVO'}
                {tournament.status === 'upcoming' && 'PRÓXIMAMENTE'}
                {tournament.status === 'completed' && 'FINALIZADO'}
              </span>
              <span className="text-valorant-light uppercase text-sm">
                {tournament.region}
              </span>
            </div>
            <h1 className="text-6xl font-tungsten text-white tracking-wider mb-4">
              {tournament.name}
            </h1>
            <p className="text-xl text-valorant-light max-w-3xl">
              {tournament.description}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-valorant-dark-secondary border-b-2 border-valorant-dark-tertiary sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-bold uppercase text-sm transition-all clip-corner-sm ${
                  activeTab === tab.id
                    ? 'bg-valorant-red text-white'
                    : 'text-valorant-light hover:text-white hover:bg-valorant-dark-tertiary'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Tournament Info */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="card-valorant p-6 text-center">
                <div className="text-xs text-valorant-light uppercase mb-2">Premio</div>
                <div className="text-3xl font-tungsten text-valorant-red">
                  {tournament.prize}
                </div>
              </div>
              <div className="card-valorant p-6 text-center">
                <div className="text-xs text-valorant-light uppercase mb-2">Equipos</div>
                <div className="text-3xl font-tungsten text-white">
                  {tournament.teams}
                </div>
              </div>
              <div className="card-valorant p-6 text-center">
                <div className="text-xs text-valorant-light uppercase mb-2">Inicio</div>
                <div className="text-xl font-tungsten text-white">
                  {new Date(tournament.startDate).toLocaleDateString('es-ES')}
                </div>
              </div>
              <div className="card-valorant p-6 text-center">
                <div className="text-xs text-valorant-light uppercase mb-2">Fin</div>
                <div className="text-xl font-tungsten text-white">
                  {new Date(tournament.endDate).toLocaleDateString('es-ES')}
                </div>
              </div>
            </div>

            {/* Recent Matches */}
            <div>
              <h2 className="text-3xl font-tungsten text-white mb-6 tracking-wider">
                PARTIDOS RECIENTES
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tournamentMatches.slice(0, 4).map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'matches' && (
          <div>
            <h2 className="text-3xl font-tungsten text-white mb-6 tracking-wider">
              TODOS LOS PARTIDOS
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tournamentMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'bracket' && (
          <div>
            <h2 className="text-3xl font-tungsten text-white mb-6 tracking-wider">
              BRACKET DEL TORNEO
            </h2>
            <div className="space-y-8">
              {mockBracket.rounds.map((round, roundIndex) => (
                <div key={roundIndex} className="card-valorant p-6">
                  <h3 className="text-2xl font-tungsten text-valorant-red mb-4 tracking-wider">
                    {round.name}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {round.matches.map((match, matchIndex) => (
                      <div key={matchIndex} className="bg-valorant-dark-tertiary p-4 clip-corner-sm">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-white font-bold">{match.team1}</span>
                          <span className="text-2xl font-tungsten text-valorant-red">
                            {match.score1 !== null ? match.score1 : '-'}
                          </span>
                        </div>
                        <div className="divider-glow my-2"></div>
                        <div className="flex justify-between items-center">
                          <span className="text-white font-bold">{match.team2}</span>
                          <span className="text-2xl font-tungsten text-white">
                            {match.score2 !== null ? match.score2 : '-'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentDetail;
