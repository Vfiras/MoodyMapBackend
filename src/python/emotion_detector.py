from flask import Flask, request, jsonify
from PIL import Image
import torch
import torchvision.transforms as transforms
import torch.nn as nn
import torch.nn.functional as F
import os

app = Flask(__name__)

# Define the transformation
transform = transforms.Compose([
    transforms.Resize((56, 56)),  # Resize to 56x56
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# EmotionNet Model Definition
class EmotionNet(nn.Module):
    def __init__(self, num_classes):
        super(EmotionNet, self).__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 64, kernel_size=3, stride=1, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(kernel_size=2, stride=2),
            # Add more layers as needed
        )
        self.classifier = nn.Sequential(
            nn.Linear(64 * 32 * 32, 128),  # Adjust the dimensions based on input size
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(128, num_classes)   # num_classes is used here
        )

def forward(self, x):
    x = self.features(x)
    print(f"Shape after features: {x.shape}")
    x = torch.flatten(x, 1)
    print(f"Shape after flatten: {x.shape}")
    x = self.classifier(x)
    return x



    class EmotionDetector(nn.Module):
def __init__(self):
    super(EmotionDetector, self).__init__()
    self.features = nn.Sequential(
        nn.Conv2d(3, 16, kernel_size=3, stride=2, padding=1),
        nn.ReLU(),
        nn.MaxPool2d(kernel_size=2, stride=2)
    )
    # Placeholder; will be replaced after model initialization
    self.classifier = None

def forward(self, x):
    x = self.features(x)
    x = torch.flatten(x, 1)
    if self.classifier is None:  # Initialize classifier dynamically
        self.classifier = nn.Sequential(
            nn.Linear(x.size(1), 128),
            nn.ReLU(),
            nn.Linear(128, 8)
        )
    x = self.classifier(x)
    return x



# Load the model
def load_model(model_path):
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = EmotionNet()
    checkpoint = torch.load(model_path, map_location=device)
    model.load_state_dict(checkpoint)
    model.to(device)
    model.eval()
    return model, device

# Predict emotion
def predict_emotion(model, image, device):
    image = transform(image).unsqueeze(0).to(device)
    with torch.no_grad():
        outputs = model(image)
        probabilities = F.softmax(outputs, dim=1)
        confidence, predicted = torch.max(probabilities, 1)
    return predicted.item(), confidence.item()

# Endpoint for emotion prediction
@app.route('/predict-emotion', methods=['POST'])
def predict_emotion_endpoint():
    try:
        # Check if the request contains an image
        if 'image' not in request.files:
            return jsonify({"status": "error", "message": "No image found in the request"}), 400

        # Get the image file
        image_file = request.files['image']
        image = Image.open(image_file).convert('RGB')

        # Predict emotion
        emotion, confidence = predict_emotion(model, image, device)

        # Emotion labels
        emotion_labels = ['angry', 'happy', 'sad']
        response = {
            "status": "success",
            "emotion": emotion_labels[emotion],
            "confidence": round(confidence * 100, 2)
        }
        return jsonify(response), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    # Path to the model file
    model_dir = os.path.join(os.path.dirname(__file__), 'models')
    model_path = os.path.join(model_dir, 'emotion_model.pth')

    # Load the model
    model, device = load_model(model_path)

    # Run the Flask app
    app.run(host='0.0.0.0', port=5000)
