const NewsCard = ({ news }) => {
  return (
    <a href={news.url || '#'} target="_blank" rel="noopener noreferrer" className="block">
      <div className="card-valorant overflow-hidden group hover:scale-105 transition-transform duration-300 h-full">
      {/* News Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={news.image}
          alt={news.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-valorant-dark via-transparent to-transparent"></div>
        
        {/* Category Badge */}
        <div className="absolute top-4 left-4 bg-valorant-red px-3 py-1 text-xs font-bold uppercase text-white clip-corner-sm">
          {news.category}
        </div>
      </div>

      {/* News Content */}
      <div className="p-6">
        <h3 className="text-xl font-tungsten text-white mb-2 tracking-wider line-clamp-2">
          {news.title}
        </h3>
        
        <p className="text-valorant-light text-sm mb-4 line-clamp-3">
          {news.description}
        </p>

        {news.author && (
          <p className="text-valorant-red text-xs mb-2 font-bold uppercase">
            Por {news.author}
          </p>
        )}

        <div className="divider-glow mb-4"></div>

        {/* Date */}
        <div className="flex justify-between items-center">
          <span className="text-xs text-valorant-light">
            {new Date(news.date).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'long',
              year: 'numeric'
            })}
          </span>
          <span className="text-valorant-red text-sm font-bold uppercase group-hover:text-white transition-colors">
            Leer más →
          </span>
        </div>
      </div>
    </div>
    </a>
  );
};

export default NewsCard;
