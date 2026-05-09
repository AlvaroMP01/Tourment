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

# Usuario no-root para minimizar superficie de ataque si el proceso es comprometido.
RUN useradd --create-home appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 5000

# Gunicorn como WSGI de producción. El dev server de Flask (`python app.py`) NO
# debe correrse en producción: no maneja concurrencia ni recursos correctamente.
# Workers fijos en 2 — Railway lo escala vertical, no horizontal por workers.
# Railway respeta $PORT si está seteado; sino usa 5000.
CMD ["sh", "-c", "gunicorn -b 0.0.0.0:${PORT:-5000} -w 2 --timeout 30 --access-logfile - --error-logfile - app:app"]
