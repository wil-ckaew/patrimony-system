# ai_service/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
from PIL import Image
import numpy as np
import io
import cv2
import os

app = Flask(__name__)
CORS(app)

# Simulação de um modelo de classificação (substitua por seu modelo real)
class PatrimonyClassifier:
    def __init__(self):
        # Carregar modelo treinado
        # self.model = tf.keras.models.load_model('models/patrimony_classifier.h5')
        self.classes = ['Cadeira', 'Mesa', 'Computador', 'Veículo', 'Equipamento']
        
    def predict(self, image):
        # Pré-processamento da imagem
        image = image.resize((224, 224))
        image_array = np.array(image) / 255.0
        image_array = np.expand_dims(image_array, axis=0)
        
        # Fazer previsão (simulado)
        # prediction = self.model.predict(image_array)
        # class_idx = np.argmax(prediction)
        
        # Simulação enquanto o modelo não está implementado
        class_idx = 1  # Simula que é uma mesa
        confidence = 0.92
        
        return self.classes[class_idx], confidence

classifier = PatrimonyClassifier()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"})

@app.route('/classify', methods=['POST'])
def classify_image():
    if 'image' not in request.files:
        return jsonify({'error': 'Nenhuma imagem enviada'}), 400
    
    try:
        image_file = request.files['image']
        image = Image.open(io.BytesIO(image_file.read()))
        
        # Classificar a imagem
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
        
        # Converter para OpenCV format (BGR)
        cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        # Simular detecção de danos (implementação real necessitaria de um modelo treinado)
        has_damage = simulate_damage_detection(cv_image)
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
    # Simulação simples - em produção, use um modelo de detecção de danos treinado
    return np.random.random() > 0.7  # 30% de chance de detectar "dano"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)