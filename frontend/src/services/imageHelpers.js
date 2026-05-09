// Distingue paths subidos de strings legacy (emoji o URL externa). Solo
// renderizamos <img> si el path empieza con un prefijo conocido.

const UPLOAD_PREFIXES = ['avatars/', 'team_logos/', 'tournament_images/'];

// VITE_BASE_URL apunta al backend con /api al final (ej: https://tourment.up.railway.app/api).
// Para uploads quitamos el /api y añadimos /uploads. En dev local está vacío
// y Vite proxea /uploads a Flask (ver vite.config.js).
const API_BASE = import.meta.env.VITE_BASE_URL || '';
const UPLOADS_BASE = API_BASE.replace(/\/api\/?$/, '') + '/uploads';

export const isUploadedImage = (path) => {
  if (!path || typeof path !== 'string') return false;
  return UPLOAD_PREFIXES.some((p) => path.startsWith(p));
};

export const getImageUrl = (path) => {
  if (!isUploadedImage(path)) return null;
  return `${UPLOADS_BASE}/${path}`;
};
