import argparse
import os

from ml.train_classifier import TrainConfig, train

def train_from_directory(dataset_path):
    """
    Trains a CNN using a directory structure (ImageFolder format):
    dataset/
        Acne Vulgaris/
            img1.jpg
            img2.jpg
        Eczema (Atopic Dermatitis)/
            img1.jpg

    Outputs:
      - backend/app/skin_classifier.pt
      - backend/app/skin_classifier_classes.json
    """
    if not os.path.exists(dataset_path):
        print(f"Error: Dataset path {dataset_path} does not exist.")
        return

    print(f"🚀 Starting CNN Training on dataset: {dataset_path}")

    cfg = TrainConfig(
        data_dir=dataset_path,
        out_dir=os.path.abspath(os.path.join(os.path.dirname(__file__), "ml", "outputs")),
    )
    res = train(cfg)
    print("✅ Training Complete.")
    print(f"Model weights saved to: {res['weights_path']}")
    print(f"Class list saved to: {res['classes_path']}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train SkinMorph AI Model")
    parser.add_argument("--data", type=str, required=True, help="Path to the dataset directory")
    parser.add_argument("--epochs", type=int, default=12, help="Max epochs")
    parser.add_argument("--batch", type=int, default=32, help="Batch size")
    parser.add_argument("--lr", type=float, default=3e-4, help="Learning rate")
    parser.add_argument("--val", type=float, default=0.15, help="Validation split fraction")
    args = parser.parse_args()

    # pass through CLI overrides
    from ml.train_classifier import TrainConfig as _TC
    from ml.train_classifier import train as _train

    cfg = _TC(
        data_dir=args.data,
        out_dir=os.path.abspath(os.path.join(os.path.dirname(__file__), "ml", "outputs")),
        epochs=args.epochs,
        batch_size=args.batch,
        lr=args.lr,
        val_size=args.val,
    )
    _train(cfg)
