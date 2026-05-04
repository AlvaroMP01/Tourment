import { getImageUrl, isUploadedImage } from '../services/imageHelpers';

const SIZE_CLASSES = {
  xs: 'w-8 h-8',
  sm: 'w-12 h-12',
  md: 'w-20 h-20',
  lg: 'w-32 h-32',
  xl: 'w-48 h-48',
};

const PlaceholderAvatar = () => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" aria-hidden="true">
    <rect width="64" height="64" fill="#1a1a2e" />
    <circle cx="32" cy="24" r="10" fill="none" stroke="#ff4655" strokeWidth="2.5" />
    <path
      d="M12 56 C12 44, 22 38, 32 38 C42 38, 52 44, 52 56"
      fill="none"
      stroke="#ff4655"
      strokeWidth="2.5"
      strokeLinecap="square"
    />
  </svg>
);

const Avatar = ({ path, size = 'md', className = '', alt = 'Avatar' }) => {
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const containerCls = `${sizeClass} bg-valorant-dark-secondary border-2 border-valorant-red clip-corner overflow-hidden flex items-center justify-center ${className}`;

  if (isUploadedImage(path)) {
    return (
      <div className={containerCls}>
        <img src={getImageUrl(path)} alt={alt} className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div className={containerCls}>
      <PlaceholderAvatar />
    </div>
  );
};

export default Avatar;
