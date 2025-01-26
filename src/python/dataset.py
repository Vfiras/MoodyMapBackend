import os
from torch.utils.data import Dataset, DataLoader, random_split
from torchvision.datasets.folder import default_loader
import torchvision.transforms as transforms

# Define emotion labels
emotion_labels = [
    "anger", "contempt", "disgust", "fear",
    "happy", "neutral", "sad", "surprised"
]

# Define transformations
transform = transforms.Compose([
    transforms.Resize((56, 56)),  # Resize to 56x56
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

class EmotionDataset(Dataset):
    def __init__(self, root_dir, transform=None):
        self.root_dir = root_dir
        self.transform = transform
        self.data = []
        self.labels = []

        print(f"Initializing EmotionDataset with root_dir: {self.root_dir}")

        # Load data from folders
        for person_id in os.listdir(root_dir):
            person_path = os.path.join(root_dir, person_id)
            if os.path.isdir(person_path):
                print(f"Found person directory: {person_path}")
                for img_name in os.listdir(person_path):
                    img_path = os.path.join(person_path, img_name)

                    # Extract emotion from filename (e.g., "angry.jpg" -> "angry")
                    emotion_name = os.path.splitext(img_name)[0].lower()
                    if emotion_name in emotion_labels:
                        self.data.append(img_path)
                        self.labels.append(emotion_labels.index(emotion_name))
                        print(f"Loaded image: {img_path}, label: {emotion_name}")
                    else:
                        print(f"Skipped unknown emotion: {img_name}")

        print(f"Total samples loaded: {len(self.data)}")

        if len(self.data) == 0:
            raise ValueError(f"No valid data found in {self.root_dir}. Check directory structure.")

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        img_path = self.data[idx]
        label = self.labels[idx]
        image = default_loader(img_path)

        if self.transform:
            image = self.transform(image)

        return image, label

def load_datasets(dataset_path, batch_size=32, split_ratio=0.8):
    print(f"Loading datasets from: {dataset_path}")
    emotion_dataset = EmotionDataset(root_dir=dataset_path, transform=transform)

    # Split dataset into training and validation
    train_size = int(split_ratio * len(emotion_dataset))
    val_size = len(emotion_dataset) - train_size
    train_dataset, val_dataset = random_split(emotion_dataset, [train_size, val_size])

    print(f"Dataset split into train: {train_size}, validation: {val_size}")

    # Create data loaders
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)

    return train_loader, val_loader
