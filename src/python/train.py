import torch
import torch.nn as nn
import torch.optim as optim
from emotion_detector import EmotionNet
from dataset import load_datasets
import os

# Set device
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Using device: {device}")

# Load dataset
dataset_path = './archive/images'
print(f"Dataset path: {dataset_path}")

try:
    train_loader, val_loader = load_datasets(dataset_path)
    print("Datasets loaded successfully.")
except Exception as e:
    print(f"Error loading datasets: {e}")
    exit()

# Initialize model, loss function, optimizer
model = EmotionNet(num_classes=8).to(device)
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)

# Training parameters
epochs = 10
best_val_accuracy = 0.0

print("Starting training...")

for epoch in range(epochs):
    model.train()
    running_loss = 0.0

    print(f"Epoch {epoch+1}/{epochs}")

    # Training loop
    for i, (images, labels) in enumerate(train_loader):
        images, labels = images.to(device), labels.to(device)

        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item()

        if (i + 1) % 10 == 0:  # Print every 10 batches
            print(f"Batch {i+1}/{len(train_loader)} - Loss: {loss.item():.4f}")

    print(f"Epoch {epoch+1} - Average Loss: {running_loss/len(train_loader):.4f}")

    # Validation loop
    model.eval()
    correct = 0
    total = 0
    with torch.no_grad():
        for images, labels in val_loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            _, predicted = torch.max(outputs, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()

    val_accuracy = 100 * correct / total
    print(f"Epoch {epoch+1} - Validation Accuracy: {val_accuracy:.2f}%")

    # Save the model if validation accuracy improves
    if val_accuracy > best_val_accuracy:
        best_val_accuracy = val_accuracy
        torch.save(model.state_dict(), './models/emotion_model.pth')
        print(f"Model saved with accuracy: {val_accuracy:.2f}%")

print("Training complete.")
