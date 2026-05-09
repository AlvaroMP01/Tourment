FROM mirror.gcr.io/library/python:3.12-slim

WORKDIR /app

# Instalamos dependencias del sistema necesarias para compilar librerías de Python como cryptography
RUN apt-get update && apt-get install -y \
    gcc \
    libssl-dev \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Se ejecuta como root para poder escribir en el Volume montado por Railway
# en /app/uploads (mount con propiedad root que tapa cualquier chown previo).
# Aceptable en Railway: el container vive en su propio namespace aislado.

EXPOSE 5000

# Gunicorn como WSGI de producción. El dev server de Flask (`python app.py`) NO
# debe correrse en producción: no maneja concurrencia ni recursos correctamente.
# Workers fijos en 2 — Railway lo escala vertical, no horizontal por workers.
# Railway respeta $PORT si está seteado; sino usa 5000.
#
# Antes de gunicorn:
#   1. db.create_all() — idempotente, crea tablas si no existen.
#   2. seed.py — siembra datos de prueba (también idempotente).
# Si seed falla (p. ej. ADMIN_PASSWORD no está), no bloquea el arranque.
CMD ["sh", "-c", "python -c 'from app import app, db; ctx = app.app_context(); ctx.push(); db.create_all()' && (python seed.py 2>&1 || echo '[ENTRYPOINT] seed.py falló o se omitió, continuando con gunicorn') && gunicorn -b 0.0.0.0:${PORT:-5000} -w 2 --timeout 30 --access-logfile - --error-logfile - app:app"]
