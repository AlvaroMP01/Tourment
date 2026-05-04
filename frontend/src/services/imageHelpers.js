// Helpers para distinguir imágenes subidas (path interno) de strings legacy
// (emoji o URL externa). El backend hoy no permite URLs externas; los datos
// legacy en la DB pueden tener cualquier cosa, así que el frontend solo
// renderiza <img> si el path empieza con uno de los prefijos conocidos.
//
// La URL final es relativa (/uploads/...) — Vite proxea a Flask en dev, y
// en prod nginx hace el mismo passthrough. Misma estrategia que /api.

const UPLOAD_PREFIXES = ['avatars/', 'team_logos/', 'tournament_images/'];

export const isUploadedImage = (path) => {
  if (!path || typeof path !== 'string') return false;
  return UPLOAD_PREFIXES.some((p) => path.startsWith(p));
};

export const getImageUrl = (path) => {
  if (!isUploadedImage(path)) return null;
  return `/uploads/${path}`;
};
