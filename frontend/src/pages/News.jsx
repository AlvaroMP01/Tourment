import { useState, useEffect } from 'react';
import NewsCard from '../components/NewsCard';
import LoadingSpinner from '../components/LoadingSpinner';
import vlrApi from '../services/vlrApi';
import { mockNews } from '../data/mockData';

const News = () => {
  const [vlrNews, setVlrNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchNews = async () => {
      const news = await vlrApi.getNews();
      setVlrNews(news);
      setLoading(false);
    };

    fetchNews();
  }, []);

  // Use VLR news if available, otherwise use mock data
  const newsToDisplay = vlrNews.length > 0 ? vlrNews : mockNews;

  const filteredNews = filter === 'all' 
    ? newsToDisplay 
    : newsToDisplay.filter(n => n.category === filter);

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
        ) : filteredNews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNews.map((news, index) => (
              <NewsCard
                key={news.id || index}
                news={{
                  id: news.id || index,
                  title: news.title,
                  description: news.description || news.desc,
                  date: news.date,
                  image: news.image || news.urlToImage || mockNews[index % mockNews.length]?.image,
                  category: news.category || 'Noticias',
                  author: news.author,
                  url: news.url_path
                    ? (news.url_path.startsWith('http') ? news.url_path : `https://vlr.gg${news.url_path}`)
                    : (news.url || '#')
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

        {/* VLR.gg Attribution */}
        {vlrNews.length > 0 && (
          <div className="mt-12 text-center">
            <p className="text-valorant-light text-sm">
              Noticias proporcionadas por{' '}
              <a
                href="https://www.vlr.gg"
                target="_blank"
                rel="noopener noreferrer"
                className="text-valorant-red hover:text-white transition-colors font-bold"
              >
                VLR.gg
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default News;
