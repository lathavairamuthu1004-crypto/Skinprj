import argparse
import os
import random
from dataclasses import dataclass
from typing import Dict, List, Tuple

import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, classification_report

from app.constants import DISEASES_INFO

from .skin_classifier import (
    build_model,
    build_transforms,
    save_classes,
    save_weights,
    set_trainable_backbone,
    set_trainable_layer4,
)
from .class_names import canonicalize_classes


def seed_everything(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    try:
        import torch

        torch.manual_seed(seed)
        torch.cuda.manual_seed_all(seed)
        torch.backends.cudnn.deterministic = True
        torch.backends.cudnn.benchmark = False
    except Exception:
        pass


@dataclass
class TrainConfig:
    data_dir: str
    out_dir: str
    epochs: int = 12
    batch_size: int = 32
    lr: float = 3e-4
    weight_decay: float = 1e-4
    val_size: float = 0.15
    seed: int = 42
    num_workers: int = 2
    patience: int = 3
    warmup_epochs: int = 2
    finetune_layer4: bool = True
    min_confidence: float = 0.0


class _SubsetWithTransform:
    def __init__(self, base_dataset, indices: List[int], transform):
        self.base = base_dataset
        self.indices = indices
        self.transform = transform

    def __len__(self):
        return len(self.indices)

    def __getitem__(self, i: int):
        idx = self.indices[i]
        x, y = self.base[idx]
        if self.transform is not None:
            x = self.transform(x)
        return x, y


def _device():
    import torch

    return "cuda" if torch.cuda.is_available() else "cpu"


def _build_loaders(cfg: TrainConfig):
    import torch
    from torchvision.datasets import ImageFolder
    from torch.utils.data import DataLoader

    # Windows + multi-worker DataLoader can hang between epochs on some setups.
    if os.name == "nt" and cfg.num_workers and cfg.num_workers > 0:
        cfg.num_workers = 0

    base = ImageFolder(cfg.data_dir)  # returns PIL.Image by default, no transform
    if len(base.classes) < 2:
        raise ValueError("Dataset must contain at least 2 class folders.")

    y = [base.samples[i][1] for i in range(len(base.samples))]
    idx = list(range(len(base.samples)))

    train_idx, val_idx = train_test_split(
        idx,
        test_size=cfg.val_size,
        random_state=cfg.seed,
        stratify=y,
    )

    train_ds = _SubsetWithTransform(base, train_idx, build_transforms(train=True))
    val_ds = _SubsetWithTransform(base, val_idx, build_transforms(train=False))

    # Handle class imbalance via weighted sampling on the training split.
    train_labels = [base.samples[i][1] for i in train_idx]
    class_counts = np.bincount(np.array(train_labels, dtype=np.int64), minlength=len(base.classes)).astype(np.float64)
    class_counts[class_counts == 0] = 1.0
    class_weights = 1.0 / class_counts
    sample_weights = torch.DoubleTensor([class_weights[y] for y in train_labels])
    sampler = torch.utils.data.WeightedRandomSampler(
        weights=sample_weights,
        num_samples=len(sample_weights),
        replacement=True,
    )

    train_loader = DataLoader(
        train_ds,
        batch_size=cfg.batch_size,
        shuffle=False,
        sampler=sampler,
        num_workers=cfg.num_workers,
        pin_memory=True,
    )
    val_loader = DataLoader(
        val_ds,
        batch_size=cfg.batch_size,
        shuffle=False,
        num_workers=cfg.num_workers,
        pin_memory=True,
    )

    canonical_classes, mapping = canonicalize_classes(base.classes, list(DISEASES_INFO.keys()))
    if mapping and any(k != v for k, v in mapping.items()):
        print("\nClass name mapping (dataset -> used by model):")
        for k in base.classes:
            v = mapping.get(k, k)
            if k == v:
                print(f"- {k}")
            else:
                print(f"- {k}  ->  {v}")

    return canonical_classes, train_loader, val_loader


def train(cfg: TrainConfig) -> Dict:
    import torch

    os.makedirs(cfg.out_dir, exist_ok=True)
    seed_everything(cfg.seed)

    classes, train_loader, val_loader = _build_loaders(cfg)
    device = _device()

    model = build_model(num_classes=len(classes)).to(device)
    # Transfer-learning schedule:
    # - Warmup: train only the classifier head
    # - Finetune: optionally unfreeze layer4 for better domain adaptation
    set_trainable_backbone(model, trainable=False)
    if cfg.finetune_layer4:
        set_trainable_layer4(model, trainable=False)

    criterion = torch.nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=cfg.lr, weight_decay=cfg.weight_decay)

    best_f1 = -1.0
    best_state = None
    no_improve = 0

    for epoch in range(1, cfg.epochs + 1):
        if epoch == cfg.warmup_epochs + 1 and cfg.finetune_layer4:
            set_trainable_layer4(model, trainable=True)
            optimizer = torch.optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=cfg.lr * 0.5, weight_decay=cfg.weight_decay)

        model.train()
        train_losses: List[float] = []

        for xb, yb in train_loader:
            xb = xb.to(device, non_blocking=True)
            yb = yb.to(device, non_blocking=True)

            optimizer.zero_grad(set_to_none=True)
            logits = model(xb)
            loss = criterion(logits, yb)
            loss.backward()
            optimizer.step()
            train_losses.append(float(loss.detach().cpu().item()))

        model.eval()
        y_true: List[int] = []
        y_pred: List[int] = []
        val_losses: List[float] = []

        with torch.no_grad():
            for xb, yb in val_loader:
                xb = xb.to(device, non_blocking=True)
                yb = yb.to(device, non_blocking=True)
                logits = model(xb)
                loss = criterion(logits, yb)
                val_losses.append(float(loss.detach().cpu().item()))
                pred = torch.argmax(logits, dim=1)
                y_true.extend(yb.cpu().numpy().tolist())
                y_pred.extend(pred.cpu().numpy().tolist())

        acc = accuracy_score(y_true, y_pred)
        f1 = f1_score(y_true, y_pred, average="macro")
        print(
            f"Epoch {epoch:02d}/{cfg.epochs} | "
            f"train_loss={np.mean(train_losses):.4f} | val_loss={np.mean(val_losses):.4f} | "
            f"acc={acc:.4f} | macro_f1={f1:.4f}"
        )

        if f1 > best_f1 + 1e-4:
            best_f1 = f1
            best_state = {k: v.detach().cpu() for k, v in model.state_dict().items()}
            no_improve = 0
        else:
            no_improve += 1
            if no_improve >= cfg.patience:
                print(f"Early stopping: no improvement for {cfg.patience} epochs.")
                break

    if best_state is None:
        best_state = model.state_dict()
    model.load_state_dict(best_state)

    # final report on val
    model.eval()
    import torch

    y_true = []
    y_pred = []
    with torch.no_grad():
        for xb, yb in val_loader:
            xb = xb.to(device)
            logits = model(xb)
            pred = torch.argmax(logits, dim=1).cpu().numpy().tolist()
            y_pred.extend(pred)
            y_true.extend(yb.numpy().tolist())

    report = classification_report(y_true, y_pred, target_names=classes, digits=4, zero_division=0)
    print("\nValidation classification report:\n")
    print(report)

    # save artifacts into backend/app so API can load it easily
    app_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "app"))
    weights_path = os.path.join(app_dir, "skin_classifier.pt")
    classes_path = os.path.join(app_dir, "skin_classifier_classes.json")

    save_weights(model, weights_path)
    save_classes(classes, classes_path)

    return {
        "classes": classes,
        "best_macro_f1": float(best_f1),
        "weights_path": weights_path,
        "classes_path": classes_path,
        "device": device,
    }


def main():
    parser = argparse.ArgumentParser(description="Train skin disease image classifier (ResNet18 transfer learning)")
    parser.add_argument("--data", required=True, help="Dataset directory in ImageFolder format (class folders)")
    parser.add_argument("--epochs", type=int, default=12)
    parser.add_argument("--batch", type=int, default=32)
    parser.add_argument("--lr", type=float, default=3e-4)
    parser.add_argument("--val", type=float, default=0.15)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--warmup", type=int, default=2, help="Epochs to train only the classifier head")
    parser.add_argument("--no-layer4", action="store_true", help="Disable finetuning of ResNet layer4")
    args = parser.parse_args()

    cfg = TrainConfig(
        data_dir=args.data,
        out_dir=os.path.abspath(os.path.join(os.path.dirname(__file__), "outputs")),
        epochs=args.epochs,
        batch_size=args.batch,
        lr=args.lr,
        val_size=args.val,
        seed=args.seed,
        warmup_epochs=args.warmup,
        finetune_layer4=not args.no_layer4,
    )
    res = train(cfg)
    print("\nSaved:")
    print(f"- Weights: {res['weights_path']}")
    print(f"- Classes: {res['classes_path']}")


if __name__ == "__main__":
    main()

