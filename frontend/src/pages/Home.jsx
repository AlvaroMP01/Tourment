import { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import TournamentCard from '../components/TournamentCard';
import NewsCard from '../components/NewsCard';
import TeamCard from '../components/TeamCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EventCalendar from '../components/EventCalendar';
import { mockTournaments, mockNews, mockTeams } from '../data/mockData';
import vlrApi from '../services/vlrApi';

const Home = () => {
  const [vlrNews, setVlrNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVlrNews = async () => {
      const news = await vlrApi.getNews();
      setVlrNews(news.slice(0, 3)); // Get first 3 news items
      setLoading(false);
    };

    fetchVlrNews();
  }, []);

  // Get featured tournaments (live and upcoming)
  const featuredTournaments = mockTournaments.filter(
    t => t.status === 'live' || t.status === 'upcoming'
  ).slice(0, 3);

  // Get top teams
  const topTeams = mockTeams.slice(0, 3);

  return (
    <div className="min-h-screen bg-valorant-dark">
      {/* Hero Section */}
      <Hero />

      {/* Featured Tournaments */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-4xl font-tungsten text-white tracking-wider">
              TORNEOS DESTACADOS
            </h2>
            <div className="h-1 w-24 bg-valorant-red mt-2"></div>
          </div>
          <a
            href="/tournaments"
            className="text-valorant-red hover:text-white transition-colors font-bold uppercase text-sm"
          >
            Ver todos →
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredTournaments.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      </section>

      {/* Calendario de Eventos */}
      <section className="bg-valorant-dark py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-4xl font-tungsten text-white tracking-wider">
                CALENDARIO DE EVENTOS
              </h2>
              <div className="h-1 w-24 bg-valorant-red mt-2"></div>
            </div>
          </div>
          <div className="max-w-4xl mx-auto">
            <EventCalendar />
          </div>
        </div>
      </section>

      {/* Top Teams */}
      <section className="bg-valorant-dark-secondary py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-4xl font-tungsten text-white tracking-wider">
                TOP EQUIPOS
              </h2>
              <div className="h-1 w-24 bg-valorant-red mt-2"></div>
            </div>
            <a
              href="/teams"
              className="text-valorant-red hover:text-white transition-colors font-bold uppercase text-sm"
            >
              Ver ranking →
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topTeams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        </div>
      </section>

      {/* VLR.gg News */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-4xl font-tungsten text-white tracking-wider">
              NOTICIAS VALORANT
            </h2>
            <div className="h-1 w-24 bg-valorant-red mt-2"></div>
            <p className="text-valorant-light text-sm mt-2">
              Últimas noticias del mundo competitivo de VALORANT
            </p>
          </div>
          <a
            href="/news"
            className="text-valorant-red hover:text-white transition-colors font-bold uppercase text-sm"
          >
            Más noticias →
          </a>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Show VLR news if available, otherwise show mock news */}
            {(vlrNews.length > 0 ? vlrNews : mockNews).slice(0, 3).map((news, index) => (
              <NewsCard
                key={news.id || index}
                news={{
                  id: news.id || index,
                  title: news.title,
                  description: news.description || news.desc,
                  date: news.date,
                  image: news.image || news.urlToImage || mockNews[index]?.image,
                  category: news.category || 'Noticias'
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Call to Action */}
      <section className="bg-animated pattern-overlay py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-tungsten text-white mb-4 tracking-wider">
            ¿LISTO PARA COMPETIR?
          </h2>
          <p className="text-xl text-valorant-light mb-8">
            Únete a miles de jugadores y demuestra tu habilidad en el campo de batalla
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/tournaments" className="btn-valorant">
              Inscribirse Ahora
            </a>
            <a
              href="/teams"
              className="btn-valorant bg-transparent border-2 border-valorant-red hover:bg-valorant-red"
            >
              Crear Equipo
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
