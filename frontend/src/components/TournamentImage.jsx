import { getImageUrl, isUploadedImage } from '../services/imageHelpers';

// A diferencia de Avatar/TeamLogo, esta imagen suele ocupar áreas grandes
// con dimensiones definidas por el caller (e.g. h-48, h-72). Por eso no
// tiene presets de size: el contenedor lo decide quien la usa.
const PlaceholderTrophy = () => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className="w-24 h-24" aria-hidden="true">
    <rect width="64" height="64" fill="transparent" />
    <path
      d="M20 12 L44 12 L44 24 C44 32, 38 38, 32 38 C26 38, 20 32, 20 24 Z"
      fill="none"
      stroke="#ff4655"
      strokeWidth="2.5"
      strokeLinejoin="miter"
    />
    <path d="M20 16 L12 16 L12 22 C12 26, 16 28, 20 28" fill="none" stroke="#ff4655" strokeWidth="2" />
    <path d="M44 16 L52 16 L52 22 C52 26, 48 28, 44 28" fill="none" stroke="#ff4655" strokeWidth="2" />
    <path d="M32 38 L32 46" stroke="#ff4655" strokeWidth="2.5" strokeLinecap="square" />
    <path d="M22 46 L42 46 L42 52 L22 52 Z" fill="none" stroke="#ece8e1" strokeWidth="2" />
  </svg>
);

const TournamentImage = ({ path, name = '', className = '', alt }) => {
  if (isUploadedImage(path)) {
    return (
      <img
        src={getImageUrl(path)}
        alt={alt || name || 'Torneo'}
        className={className || 'w-full h-full object-cover'}
      />
    );
  }
  return (
    <div className={`${className || 'w-full h-full'} flex items-center justify-center bg-gradient-to-br from-valorant-dark via-valorant-dark-secondary to-valorant-red/40`}>
      <div className="flex flex-col items-center gap-2 opacity-80">
        <PlaceholderTrophy />
        {name && (
          <span className="text-xs font-tungsten tracking-widest uppercase text-white/40 px-4 text-center">
            {name}
          </span>
        )}
      </div>
    </div>
  );
};

export default TournamentImage;
