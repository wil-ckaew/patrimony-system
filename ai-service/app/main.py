from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import numpy as np
import io
import os

app = Flask(__name__)
CORS(app)

class PatrimonyClassifier:
    def __init__(self):
        self.classes = ['Cadeira', 'Mesa', 'Computador', 'Veículo', 'Equipamento']
        
    def predict(self, image):
        # Simulação de classificação
        image = image.resize((224, 224))
        image_array = np.array(image) / 255.0
        
        # Simulação - em produção usar modelo real
        class_idx = 1  # Simula que é uma mesa
        confidence = 0.92
        
        return self.classes[class_idx], confidence

classifier = PatrimonyClassifier()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "service": "AI Classification"})

@app.route('/classify', methods=['POST'])
def classify_image():
    if 'image' not in request.files:
        return jsonify({'error': 'Nenhuma imagem enviada'}), 400
    
    try:
        image_file = request.files['image']
        image = Image.open(io.BytesIO(image_file.read()))
        
        classification, confidence = classifier.predict(image)
        
        return jsonify({
            'classification': classification,
            'confidence': confidence,
            'suggested_name': f"{classification} Patrimonial",
            'suggested_category': get_category(classification)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_category(classification):
    categories = {
        'Cadeira': 'Mobiliário',
        'Mesa': 'Mobiliário',
        'Computador': 'Equipamento de TI',
        'Veículo': 'Transporte',
        'Equipamento': 'Equipamento'
    }
    return categories.get(classification, 'Outros')

@app.route('/detect_damage', methods=['POST'])
def detect_damage():
    if 'image' not in request.files:
        return jsonify({'error': 'Nenhuma imagem enviada'}), 400
    
    try:
        image_file = request.files['image']
        image = Image.open(io.BytesIO(image_file.read()))
        
        # Simular detecção de danos
        has_damage = simulate_damage_detection(image)
        damage_type = "Arranhão" if has_damage else "Nenhum"
        severity = "Leve" if has_damage else "Nenhum"
        
        return jsonify({
            'has_damage': has_damage,
            'damage_type': damage_type,
            'severity': severity,
            'suggestion': 'Necessita avaliação técnica' if has_damage else 'Em bom estado'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def simulate_damage_detection(image):
    # Simulação simples
    return np.random.random() > 0.7

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)