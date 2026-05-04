import { getImageUrl, isUploadedImage } from '../services/imageHelpers';

const SIZE_CLASSES = {
  xs: 'w-8 h-8',
  sm: 'w-10 h-10',
  md: 'w-16 h-16',
  lg: 'w-32 h-32',
  xl: 'w-48 h-48',
};

const PlaceholderShield = () => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" aria-hidden="true">
    <rect width="64" height="64" fill="#1a1a2e" />
    <path
      d="M32 8 L52 16 L52 34 C52 46, 44 54, 32 58 C20 54, 12 46, 12 34 L12 16 Z"
      fill="none"
      stroke="#ff4655"
      strokeWidth="2.5"
      strokeLinejoin="miter"
    />
    <path d="M32 22 L32 44" stroke="#ece8e1" strokeWidth="2" strokeLinecap="square" />
    <path d="M22 33 L42 33" stroke="#ece8e1" strokeWidth="2" strokeLinecap="square" />
  </svg>
);

const TeamLogo = ({ path, size = 'md', className = '', alt = 'Logo del equipo' }) => {
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const containerCls = `${sizeClass} bg-valorant-dark-tertiary clip-corner overflow-hidden flex items-center justify-center ${className}`;

  if (isUploadedImage(path)) {
    return (
      <div className={containerCls}>
        <img src={getImageUrl(path)} alt={alt} className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div className={containerCls}>
      <PlaceholderShield />
    </div>
  );
};

export default TeamLogo;
