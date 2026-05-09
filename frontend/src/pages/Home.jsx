import { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import TournamentCard from '../components/TournamentCard';
import NewsCard from '../components/NewsCard';
import TeamCard from '../components/TeamCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EventCalendar from '../components/EventCalendar';
import { routesAPI } from '../services/routesAPI';

const Home = () => {
  const [vlrNews, setVlrNews] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [news, ts, tms] = await Promise.all([
          routesAPI.getNews({ limit: 6 }).catch(() => []),
          routesAPI.getTournaments().catch(() => []),
          routesAPI.getTeams().catch(() => []),
        ]);
        if (cancelled) return;
        const realNews = (news || []).filter((n) => n?.title && n.title.length > 5 && n?.link);
        setVlrNews(realNews);
        setTournaments(ts || []);
        setTeams(tms || []);
      } finally {
        if (!cancelled) setLoadingNews(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Featured: live primero, luego upcoming. Hasta 3.
  const featuredTournaments = [
    ...tournaments.filter((t) => t.status === 'live'),
    ...tournaments.filter((t) => t.status === 'upcoming'),
  ].slice(0, 3);

  // Top teams: por cantidad de miembros desc, luego nombre. Hasta 3.
  const topTeams = [...teams]
    .sort((a, b) => (b.member_count || 0) - (a.member_count || 0) || a.name.localeCompare(b.name))
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-valorant-dark">
      <Hero />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-4xl font-tungsten text-white tracking-wider">TORNEOS DESTACADOS</h2>
            <div className="h-1 w-24 bg-valorant-red mt-2"></div>
          </div>
          <a href="/tournaments" className="text-valorant-red hover:text-white transition-colors font-bold uppercase text-sm">
            Ver todos →
          </a>
        </div>

        {featuredTournaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTournaments.map((t) => <TournamentCard key={t.id} tournament={t} />)}
          </div>
        ) : (
          <div className="text-center py-12 text-valorant-light">
            No hay torneos en vivo ni próximos por ahora
          </div>
        )}
      </section>

      <section className="bg-valorant-dark py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-4xl font-tungsten text-white tracking-wider">CALENDARIO DE EVENTOS</h2>
              <div className="h-1 w-24 bg-valorant-red mt-2"></div>
            </div>
          </div>
          <div className="max-w-4xl mx-auto">
            <EventCalendar />
          </div>
        </div>
      </section>

      <section className="bg-valorant-dark-secondary py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-4xl font-tungsten text-white tracking-wider">TOP EQUIPOS</h2>
              <div className="h-1 w-24 bg-valorant-red mt-2"></div>
            </div>
            <a href="/teams" className="text-valorant-red hover:text-white transition-colors font-bold uppercase text-sm">
              Ver ranking →
            </a>
          </div>

          {topTeams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topTeams.map((team) => <TeamCard key={team.id} team={team} />)}
            </div>
          ) : (
            <div className="text-center py-12 text-valorant-light">
              No hay equipos registrados todavía
            </div>
          )}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-4xl font-tungsten text-white tracking-wider">NOTICIAS VALORANT</h2>
            <div className="h-1 w-24 bg-valorant-red mt-2"></div>
            <p className="text-valorant-light text-sm mt-2">
              Últimas noticias del mundo competitivo de VALORANT
            </p>
          </div>
          <a href="/news" className="text-valorant-red hover:text-white transition-colors font-bold uppercase text-sm">
            Más noticias →
          </a>
        </div>

        {loadingNews ? (
          <LoadingSpinner />
        ) : vlrNews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vlrNews.map((news, index) => (
              <NewsCard
                key={news.id || index}
                index={index}
                news={{
                  id: news.id || index,
                  title: news.title,
                  description: news.description || news.desc,
                  date: news.date,
                  category: news.category || 'Noticias',
                  link: news.link || news.url || '#',
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📰</div>
            <h3 className="text-2xl font-tungsten text-white mb-2">NO HAY NOTICIAS DISPONIBLES</h3>
            <p className="text-valorant-light">Vuelve pronto para más actualizaciones</p>
          </div>
        )}
      </section>

      <section className="bg-animated pattern-overlay py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-tungsten text-white mb-4 tracking-wider">¿LISTO PARA COMPETIR?</h2>
          <p className="text-xl text-valorant-light mb-8">
            Únete a miles de jugadores y demuestra tu habilidad en el campo de batalla
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/tournaments" className="btn-valorant">Inscribirse Ahora</a>
            <a href="/teams" className="btn-valorant bg-transparent border-2 border-valorant-red hover:bg-valorant-red">
              Crear Equipo
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
