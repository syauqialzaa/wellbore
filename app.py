from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)
CORS(app, resources={r"/img/*": {"origins": "*"}})

# PostgreSQL Database Configuration
DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    # Fallback to individual environment variables
    DB_HOST = os.getenv('PG_HOST')
    DB_PORT = os.getenv('PG_PORT')
    DB_NAME = os.getenv('PG_DATABASE')
    DB_USER = os.getenv('PG_USER')
    DB_PASSWORD = os.getenv('PG_PASSWORD')
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Path ke folder 'img'
IMG_FOLDER = os.path.join(os.getcwd(), 'img')

# Define table model
class WellboreComponent(db.Model):
    __tablename__ = 'wellbore_components'
    id_components = db.Column(db.String(20), primary_key=True)
    uwi = db.Column(db.String(20))
    string_code = db.Column(db.String(20))
    main_component = db.Column(db.String(50))
    sub_component = db.Column(db.String(50))
    icon_name = db.Column(db.String(20))
    install_date = db.Column(db.Date)
    top_md = db.Column(db.Integer)
    bot_md = db.Column(db.Integer)
    od_inch = db.Column(db.Float)
    seq = db.Column(db.Integer)
    remark = db.Column(db.String(255))

@app.route('/api/wellbore-data1', methods=['GET'])
def get_wellbore_data1():
    try:
        components = WellboreComponent.query.filter_by(uwi='PEB000026D1').all()
        
        for component in components:
            print("komponent", component)  # Cetak setiap objek yang diambil

        result = [
            {
                "ICON_NAME": component.icon_name,
                "TOP_MD": component.top_md,
                "BOT_MD": component.bot_md,
                "OD_INCH": component.od_inch,
                'REMARKS': component.remark
            }
            for component in components
        ]
        return jsonify(result)
    except Exception as e:
        print("ERROR in /api/wellbore-data1:", str(e))
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500

@app.route('/api/wellbore-data', methods=['GET'])
def get_wellbore_data():
    try:
        uwi = request.args.get('uwi', 'PEB000026D1')  # Default UWI jika tidak diberikan
        top_md = request.args.get('top_md', type=int)
        bot_md = request.args.get('bot_md', type=int)

        print(f"Fetching wellbore data for UWI: {uwi}, TOP_MD: {top_md}, BOT_MD: {bot_md}")

        query = WellboreComponent.query.filter_by(uwi=uwi)

        if top_md is not None and bot_md is not None:
            query = query.filter(WellboreComponent.bot_md >= top_md, WellboreComponent.top_md <= bot_md)

        print(f"Generated Query: {query}")  # Debugging query

        components = query.all()

        if not components:
            print("No components found")  # Debugging
            return jsonify({"message": "No components found"}), 404

        result = [
            {
                "ICON_NAME": component.icon_name,
                "TOP_MD": component.top_md,
                "BOT_MD": component.bot_md,
                "OD_INCH": component.od_inch,
                "REMARKS": component.remark
            }
            for component in components
        ]

        return jsonify(result), 200

    except Exception as e:
        print("ERROR in /api/wellbore-data:", str(e))  # Log ke terminal
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500

# API untuk mendapatkan daftar file gambar di folder 'img'
@app.route('/api/icons', methods=['GET'])
def get_icons():
    try:
        files = [f for f in os.listdir(IMG_FOLDER) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.svg'))]
        return jsonify(files)  # Mengembalikan daftar file sebagai JSON
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Endpoint untuk melayani file gambar
@app.route('/img/<path:filename>', methods=['GET'])
def serve_image(filename):
    return send_from_directory(IMG_FOLDER, filename)

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "Wellbore API is running"}), 200

# Menjalankan server
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8181)