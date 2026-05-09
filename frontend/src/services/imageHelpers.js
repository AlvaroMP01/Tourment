// Distingue paths subidos de strings legacy (emoji o URL externa). Solo
// renderizamos <img> si el path empieza con un prefijo conocido.

const UPLOAD_PREFIXES = ['avatars/', 'team_logos/', 'tournament_images/'];

export const isUploadedImage = (path) => {
  if (!path || typeof path !== 'string') return false;
  return UPLOAD_PREFIXES.some((p) => path.startsWith(p));
};

export const getImageUrl = (path) => {
  if (!isUploadedImage(path)) return null;
  return `/uploads/${path}`;
};
