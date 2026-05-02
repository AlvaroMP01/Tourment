import { useState, useEffect } from 'react';
import NewsCard from '../components/NewsCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { routesAPI } from '../services/routesAPI';

const News = () => {
  const [vlrNews, setVlrNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const news = await routesAPI.getNews();
        setVlrNews(Array.isArray(news) ? news : []);
      } catch (e) {
        console.error('Error fetching news:', e);
        setError(e?.message || 'No se pudieron cargar las noticias.');
        setVlrNews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const filteredNews = filter === 'all' 
    ? vlrNews
    : vlrNews.filter(n => n.category === filter);

  const categories = ['all', 'Noticias', 'Resultados', 'Actualizaciones'];

  return (
    <div className="min-h-screen bg-valorant-dark py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-6xl font-tungsten text-white tracking-wider mb-4">
            NOTICIAS
          </h1>
          <div className="h-1 w-32 bg-valorant-red mb-4"></div>
          <p className="text-valorant-light text-lg">
            Mantente al día con las últimas noticias del mundo competitivo de VALORANT
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex gap-2 flex-wrap">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`px-6 py-2 font-bold uppercase text-sm clip-corner-sm transition-all ${
                filter === category
                  ? 'bg-valorant-red text-white'
                  : 'bg-valorant-dark-secondary text-valorant-light hover:bg-valorant-dark-tertiary'
              }`}
            >
              {category === 'all' ? 'Todas' : category}
            </button>
          ))}
        </div>

        {/* News Grid */}
        {loading ? (
          <LoadingSpinner size="lg" />
        ) : error ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📰</div>
            <h3 className="text-2xl font-tungsten text-white mb-2">
              NO SE PUDIERON CARGAR LAS NOTICIAS
            </h3>
            <p className="text-valorant-light">
              {error}
            </p>
          </div>
        ) : filteredNews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNews.map((news, index) => (
              <NewsCard
                key={news.id || index}
                index={index}
                news={{
                  id: news.id || index,
                  title: news.title,
                  description: news.description || news.desc,
                  date: news.date,
                  category: news.category || 'Noticias',
                  author: news.author,
                  link: news.link || news.url || '#',
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📰</div>
            <h3 className="text-2xl font-tungsten text-white mb-2">
              NO HAY NOTICIAS DISPONIBLES
            </h3>
            <p className="text-valorant-light">
              Vuelve pronto para más actualizaciones
            </p>
          </div>
        )}

        {/* RSS Attribution */}
        {vlrNews.length > 0 && (
          <div className="mt-12 text-center">
            <p className="text-valorant-light text-sm">
              Noticias proporcionadas por{' '}
              <a
                href="https://www.vlr.gg/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-valorant-red hover:text-white transition-colors font-bold"
              >
                VLR.gg (RSS)
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default News;
