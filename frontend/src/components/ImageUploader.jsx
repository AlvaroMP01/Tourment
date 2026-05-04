import { useRef, useState } from 'react';
import Avatar from './Avatar';
import TeamLogo from './TeamLogo';
import TournamentImage from './TournamentImage';
import { isUploadedImage } from '../services/imageHelpers';

const ACCEPTED_MIME = 'image/jpeg,image/png,image/webp';
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES_CLIENT = 1 * 1024 * 1024; // 1MB — coincide con MAX_CONTENT_LENGTH del backend.

const PreviewByPlaceholder = ({ placeholder, currentPath, name }) => {
  if (placeholder === 'team') return <TeamLogo path={currentPath} size="lg" />;
  if (placeholder === 'tournament') {
    return (
      <div className="w-full h-40 bg-valorant-dark-tertiary clip-corner-sm overflow-hidden">
        <TournamentImage path={currentPath} name={name} className="w-full h-full" />
      </div>
    );
  }
  return <Avatar path={currentPath} size="lg" />;
};

const ImageUploader = ({
  currentPath,
  onUpload,
  onDelete,
  placeholder = 'avatar',
  label = 'Subir Imagen',
  name = '',
}) => {
  const fileInputRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | uploading | error
  const [error, setError] = useState('');

  const hasUploadedImage = isUploadedImage(currentPath);

  const validateFile = (file) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Formato no permitido. Subí JPG, PNG o WEBP.';
    }
    if (file.size > MAX_BYTES_CLIENT) {
      return 'El archivo es demasiado grande. Máximo 1MB.';
    }
    return null;
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite re-subir el mismo archivo si re-elige
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setStatus('error');
      setError(validationError);
      return;
    }

    setStatus('uploading');
    setError('');
    try {
      await onUpload(file);
      setStatus('idle');
    } catch (err) {
      setStatus('error');
      setError(err?.message || 'No se pudo subir la imagen');
    }
  };

  const handleDeleteClick = async () => {
    if (!onDelete) return;
    if (!window.confirm('¿Eliminar la imagen?')) return;
    setStatus('uploading');
    setError('');
    try {
      await onDelete();
      setStatus('idle');
    } catch (err) {
      setStatus('error');
      setError(err?.message || 'No se pudo eliminar la imagen');
    }
  };

  const isBusy = status === 'uploading';

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <PreviewByPlaceholder placeholder={placeholder} currentPath={currentPath} name={name} />

        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_MIME}
            onChange={handleFileSelected}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isBusy}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 border-valorant-red text-valorant-red hover:bg-valorant-red hover:text-white transition-colors clip-corner-sm ${isBusy ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isBusy ? 'Subiendo...' : (hasUploadedImage ? 'Cambiar' : label)}
          </button>
          {hasUploadedImage && onDelete && (
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={isBusy}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border border-valorant-light text-valorant-light hover:bg-valorant-dark-tertiary transition-colors clip-corner-sm ${isBusy ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Eliminar
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-valorant-light/70">
        Formatos: JPG, PNG, WEBP. Máximo 1MB. Se recortará a 256×256.
      </p>

      {status === 'error' && error && (
        <div className="bg-red-500/20 border border-valorant-red px-3 py-2 text-xs text-valorant-light">
          {error}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
