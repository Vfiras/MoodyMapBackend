from flask import Flask, request, jsonify
import cv2
import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import io
from PIL import Image

# Initialize Flask app
app = Flask(__name__)

# Load the trained model
model_best = load_model('/app/model/second_model.h5')
# Classes for 7 emotional states
class_names = ['Angry', 'Disgusted', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral']

# Load the pre-trained face cascade
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

def predict_emotion_from_image(image_bytes):
    # Convert image bytes to image format
    img = Image.open(io.BytesIO(image_bytes))
    img = np.array(img)

    # Convert image to grayscale for face detection
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Detect faces in the frame
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5, minSize=(30, 30))

    # If no faces are detected, return a neutral emotion
    if len(faces) == 0:
        return 'Neutral'

    # Process the first detected face (you can modify it to handle multiple faces)
    (x, y, w, h) = faces[0]
    face_roi = img[y:y + h, x:x + w]

    # Resize the face image to the required input size for the model
    face_image = cv2.resize(face_roi, (48, 48))
    face_image = cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY)
    face_image = image.img_to_array(face_image)
    face_image = np.expand_dims(face_image, axis=0)
    face_image = np.vstack([face_image])

    # Predict emotion using the loaded model
    predictions = model_best.predict(face_image)
    emotion_label = class_names[np.argmax(predictions)]

    return emotion_label

@app.route('/predict', methods=['POST'])
def predict():
    # Get the image from the request
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    try:
        # Read image bytes
        image_bytes = file.read()

        # Get the predicted emotion
        emotion = predict_emotion_from_image(image_bytes)

        # Return the result as a JSON response
        return jsonify({'emotion': emotion})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
