const fmtDate = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(2);
  return `${dd}.${mm}.${yy}`;
};

const NewsCard = ({ news, index }) => {
  const href = news?.link || news?.url || '#';
  const dateLabel = fmtDate(news?.date);
  const idx =
    typeof index === 'number'
      ? String(index + 1).padStart(3, '0')
      : String(news?.id ?? 0).padStart(3, '0');

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block h-full"
    >
      <article className="card-valorant overflow-hidden group transition-transform duration-300 h-full hover:scale-[1.02]">
        <div className="p-6">
          {/* índice + categoría + fecha */}
          <div className="flex items-center gap-3 text-[10px] tracking-[0.18em] font-bold uppercase mb-3">
            <span className="text-valorant-light/50 tabular-nums">
              {idx}
            </span>
            <span className="w-4 h-px bg-valorant-light/30" />
            <span className="text-valorant-red">
              {news?.category || 'Noticias'}
            </span>
            <span className="flex-1" />
            {dateLabel && (
              <span className="text-valorant-light/50 tabular-nums">
                {dateLabel}
              </span>
            )}
          </div>

          {/* título grande */}
          <h3
            className={`font-tungsten text-white tracking-wider uppercase leading-[0.95] ${
              index === 0 ? 'text-4xl' : 'text-3xl'
            } line-clamp-3`}
          >
            {news?.title || 'Sin título'}
          </h3>

          {/* descripción */}
          <p className="text-valorant-light/70 text-sm leading-relaxed mt-3 line-clamp-4">
            {news?.description || ''}
          </p>

          <div className="divider-glow my-4" />

          <div className="flex justify-between items-center">
            <span className="text-valorant-light/60 text-xs">
              {href && href !== '#' ? 'Abrir en fuente' : 'Enlace no disponible'}
            </span>
            <span className="text-valorant-red text-sm font-bold uppercase group-hover:text-white transition-colors">
              Leer más →
            </span>
          </div>
        </div>
      </article>
    </a>
  );
};

export default NewsCard;
