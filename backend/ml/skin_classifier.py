import json
import os
from dataclasses import dataclass
from typing import List, Tuple, Optional

import numpy as np
from PIL import Image


@dataclass(frozen=True)
class ModelArtifacts:
    weights_path: str
    classes_path: str


def default_artifacts(app_dir: str) -> ModelArtifacts:
    return ModelArtifacts(
        weights_path=os.path.join(app_dir, "skin_classifier.pt"),
        classes_path=os.path.join(app_dir, "skin_classifier_classes.json"),
    )


def load_image_from_base64(image_base64: str) -> Image.Image:
    import base64
    import io

    if "," in image_base64:
        image_base64 = image_base64.split(",")[1]
    img_bytes = base64.b64decode(image_base64)
    return Image.open(io.BytesIO(img_bytes)).convert("RGB")


def _lazy_torch():
    import torch  # noqa
    import torchvision  # noqa
    return torch


def build_transforms(train: bool):
    torch = _lazy_torch()
    from torchvision import transforms

    mean = (0.485, 0.456, 0.406)
    std = (0.229, 0.224, 0.225)

    if train:
        return transforms.Compose(
            [
                transforms.Resize((256, 256)),
                transforms.RandomResizedCrop(224, scale=(0.8, 1.0)),
                transforms.RandomHorizontalFlip(p=0.5),
                transforms.RandomRotation(10),
                transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.15, hue=0.02),
                transforms.ToTensor(),
                transforms.Normalize(mean, std),
            ]
        )

    return transforms.Compose(
        [
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean, std),
        ]
    )


def build_model(num_classes: int):
    torch = _lazy_torch()
    from torchvision import models

    model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
    in_features = model.fc.in_features
    model.fc = torch.nn.Linear(in_features, num_classes)
    return model


def set_trainable_backbone(model, trainable: bool) -> None:
    for name, p in model.named_parameters():
        if name.startswith("fc."):
            p.requires_grad = True
        else:
            p.requires_grad = bool(trainable)


def set_trainable_layer4(model, trainable: bool) -> None:
    for name, p in model.named_parameters():
        if name.startswith("layer4."):
            p.requires_grad = bool(trainable)


def save_classes(classes: List[str], path: str) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump({"classes": classes}, f, indent=2)


def load_classes(path: str) -> List[str]:
    with open(path, "r", encoding="utf-8") as f:
        obj = json.load(f)
    classes = obj.get("classes")
    if not isinstance(classes, list) or not classes:
        raise ValueError("Invalid classes file; expected {classes: [...]} with at least 1 class.")
    return [str(c) for c in classes]


def save_weights(model, path: str) -> None:
    torch = _lazy_torch()
    state = {"state_dict": model.state_dict()}
    torch.save(state, path)


def load_weights(model, path: str):
    torch = _lazy_torch()
    state = torch.load(path, map_location="cpu")
    model.load_state_dict(state["state_dict"])
    return model


def predict_pil(
    model,
    classes: List[str],
    image: Image.Image,
    device: str = "cpu",
) -> Tuple[str, float, List[Tuple[str, float]]]:
    torch = _lazy_torch()

    model.eval()
    model.to(device)
    tfm = build_transforms(train=False)

    x = tfm(image).unsqueeze(0).to(device)
    with torch.no_grad():
        logits = model(x)
        probs = torch.softmax(logits, dim=1).squeeze(0).cpu().numpy().astype(np.float64)

    top_idx = int(np.argmax(probs))
    pred = classes[top_idx]
    conf = float(probs[top_idx])
    topk = sorted([(classes[i], float(probs[i])) for i in range(len(classes))], key=lambda t: t[1], reverse=True)[:5]
    return pred, conf, topk


def artifacts_exist(artifacts: ModelArtifacts) -> bool:
    return os.path.exists(artifacts.weights_path) and os.path.exists(artifacts.classes_path)

