"""Procesamiento y almacenamiento de uploads de imágenes.

Las imágenes se redimensionan a max 256x256, se recomprimen a JPEG con calidad
adaptativa hasta entrar en MAX_BYTES, y se guardan con nombre UUID dentro de
backend/uploads/{folder}/.

El path retornado es RELATIVO (ej: 'avatars/abc.jpg'), pensado para guardar tal
cual en la DB. El servidor sirve estos archivos desde /uploads/<path>.
"""
import io
import uuid
from pathlib import Path

from PIL import Image, UnidentifiedImageError

UPLOAD_ROOT = Path(__file__).parent / 'uploads'
ALLOWED_FOLDERS = {'avatars', 'team_logos', 'tournament_images'}
MAX_DIMENSIONS = (256, 256)
MAX_BYTES = 500 * 1024
ALLOWED_FORMATS = {'JPEG', 'PNG', 'WEBP'}


def ensure_upload_dirs():
    """Crea las carpetas de uploads si no existen. Idempotente."""
    for folder in ALLOWED_FOLDERS:
        (UPLOAD_ROOT / folder).mkdir(parents=True, exist_ok=True)


def process_and_save(file_storage, folder):
    """Valida, redimensiona, recomprime y guarda una imagen subida.

    Args:
        file_storage: werkzeug FileStorage (request.files['...']).
        folder: una de ALLOWED_FOLDERS.

    Returns:
        Path relativo dentro de uploads/, ej: 'avatars/abc123.jpg'.

    Raises:
        ValueError si la carpeta es inválida, el archivo no es imagen,
        el formato no está permitido o no se puede comprimir lo suficiente.
    """
    if folder not in ALLOWED_FOLDERS:
        raise ValueError("Carpeta inválida")

    # verify() lee magic bytes sin cargar pixels. Después hay que reabrir
    # porque verify() consume el stream.
    try:
        probe = Image.open(file_storage)
        probe.verify()
    except (UnidentifiedImageError, Exception):
        raise ValueError("El archivo no es una imagen válida")

    file_storage.seek(0)
    try:
        img = Image.open(file_storage)
        img.load()
    except (UnidentifiedImageError, Exception):
        raise ValueError("El archivo no es una imagen válida")

    if img.format not in ALLOWED_FORMATS:
        raise ValueError(
            f"Formato no permitido. Aceptados: {', '.join(sorted(ALLOWED_FORMATS))}"
        )

    # Convertir a RGB. Las imágenes con alpha (RGBA/LA/P) se aplanan sobre
    # fondo blanco — JPEG no soporta canal alfa.
    if img.mode in ('RGBA', 'LA', 'P'):
        if img.mode == 'P':
            img = img.convert('RGBA')
        bg = Image.new('RGB', img.size, (255, 255, 255))
        mask = img.split()[-1] if img.mode in ('RGBA', 'LA') else None
        bg.paste(img, mask=mask)
        img = bg
    elif img.mode != 'RGB':
        img = img.convert('RGB')

    img.thumbnail(MAX_DIMENSIONS, Image.Resampling.LANCZOS)

    # Compresión adaptativa: bajamos quality hasta entrar en MAX_BYTES.
    buffer = io.BytesIO()
    quality = 85
    while quality >= 30:
        buffer.seek(0)
        buffer.truncate()
        img.save(buffer, format='JPEG', quality=quality, optimize=True)
        if buffer.getbuffer().nbytes <= MAX_BYTES:
            break
        quality -= 10

    if buffer.getbuffer().nbytes > MAX_BYTES:
        raise ValueError("Imagen demasiado pesada incluso después de comprimir")

    filename = f"{uuid.uuid4().hex}.jpg"
    rel_path = f"{folder}/{filename}"
    abs_path = UPLOAD_ROOT / rel_path
    with open(abs_path, 'wb') as f:
        f.write(buffer.getvalue())
    return rel_path


def delete_upload(rel_path):
    """Borra un archivo subido si existe. Idempotente y silencioso.

    Solo borra paths que apuntan a una de ALLOWED_FOLDERS — los strings legacy
    (emoji, URL externa) se ignoran. No lanza excepciones aunque el archivo
    no exista o falle el unlink: la atomicidad la garantiza el caller con
    el commit transaccional.
    """
    if not rel_path or not isinstance(rel_path, str):
        return
    if '/' not in rel_path:
        return
    folder = rel_path.split('/', 1)[0]
    if folder not in ALLOWED_FOLDERS:
        return
    abs_path = UPLOAD_ROOT / rel_path
    try:
        if abs_path.exists() and abs_path.is_file():
            abs_path.unlink()
    except Exception:
        pass


def is_uploaded_path(value):
    """True si el string es un path de upload (no emoji/URL legacy)."""
    if not value or not isinstance(value, str):
        return False
    if '/' not in value:
        return False
    folder = value.split('/', 1)[0]
    return folder in ALLOWED_FOLDERS
