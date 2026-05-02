FROM mirror.gcr.io/library/python:3.9-slim

WORKDIR /app

# Instalamos dependencias del sistema necesarias para compilar librerías de Python como cryptography
RUN apt-get update && apt-get install -y \
    gcc \
    libssl-dev \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir cryptography

COPY . .

EXPOSE 5000

CMD ["python", "app.py"]
