import os
from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text # Text para poder usar SQL en el test

app = Flask(__name__)

# CONFIGURACIÓN DE LA BASE DE DATOS
user = os.getenv('MYSQL_USER', 'torneos_user')
password = os.getenv('MYSQL_PASSWORD', 'torneos_pass')
host = 'db' 
database = os.getenv('MYSQL_DATABASE', 'torneos_db')
port = '3306'

# Conexión para SQLAlchemy
app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+pymysql://{user}:{password}@{host}:{port}/{database}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

@app.route('/')
def home():
    return jsonify({"mensaje": "El servidor Backend está funcionando corrextamente."})

@app.route('/test-db')
def test_db():
    try:
        # Consulta simple "SELECT 1" para testear
        db.session.execute(text("SELECT 1"))
        return jsonify({"estado": "Éxito", "mensaje": "Conexión a MySQL exitosa"})
    except Exception as e:
        return jsonify({"estado": "Error", "mensaje": f"No se pudo conectar a la BD: {str(e)}"}), 500

if __name__ == '__main__':
    # debug=True permite cambiar código y que el servidor se reinicie solo
    app.run(host='0.0.0.0', port=5000, debug=True)