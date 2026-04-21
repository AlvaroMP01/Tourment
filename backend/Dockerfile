# Imagen Python oficial
FROM mirror.gcr.io/library/python:3.9-slim

# Carpeta de trabajo
WORKDIR /app

# Requisitos y dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos el resto del código
COPY . .

# Exponemos el puerto 5000
EXPOSE 5000

# Comando para iniciar la aplicación
CMD ["python", "app.py"]