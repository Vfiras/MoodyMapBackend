import torch

# Path to your checkpoint
checkpoint_path = r'C:\Users\User\backend-pdm\backend-pdm\src\python\models\emotion_model.pth'

# Load the checkpoint (weights and model structure)
checkpoint = torch.load(checkpoint_path)

# Print out the keys in the checkpoint dictionary to see layer names
for key in checkpoint.keys():
    print(f"Layer: {key}, Shape: {checkpoint[key].shape}")
