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
    pred = str(classes[top_idx])
    conf = float(probs[top_idx])
    # Clarify list slicing for linter
    sorted_probs = sorted([(str(classes[i]), float(probs[i])) for i in range(len(classes))], key=lambda t: t[1], reverse=True)
    topk = sorted_probs[:5]
    return pred, conf, topk


def generate_gradcam(
    model,
    classes: List[str],
    image: Image.Image,
    target_layer_name: str = "layer4",
    device: str = "cpu",
) -> Optional[str]:
    """Generates a Grad-CAM heatmap base64 string."""
    torch = _lazy_torch()
    import torch.nn.functional as F
    import base64
    import io

    # Hooks for activations and gradients
    activations = []
    gradients = []

    def get_activations(module, input, output):
        activations.append(output)

    def get_gradients(module, grad_input, grad_output):
        gradients.append(grad_output[0])

    # Find target layer
    target_layer = None
    for name, module in model.named_modules():
        if name == target_layer_name:
            target_layer = module
            break
    
    if target_layer is None:
        return None

    # Register hooks
    handle_act = target_layer.register_forward_hook(get_activations)
    handle_grad = target_layer.register_full_backward_hook(get_gradients)

    try:
        model.eval()
        model.to(device)
        tfm = build_transforms(train=False)
        x = tfm(image).unsqueeze(0).to(device)
        x.requires_grad = True

        logits = model(x)
        top_idx = torch.argmax(logits, dim=1)
        
        # Zero gradients and backprop
        model.zero_grad()
        logits[0, top_idx].backward()

        # Generate heatmap
        grads = gradients[0]
        acts = activations[0]
        
        weights = torch.mean(grads, dim=(2, 3), keepdim=True)
        cam = torch.sum(weights * acts, dim=1).squeeze(0)
        cam = F.relu(cam)
        
        # Normalize
        cam_min, cam_max = cam.min(), cam.max()
        cam = (cam - cam_min) / (cam_max - cam_min + 1e-8)
        cam = cam.cpu().detach().numpy()

        # Resize heatmap and overlay
        heatmap = Image.fromarray((cam * 255).astype(np.uint8)).resize(image.size, resample=Image.BILINEAR)
        
        # Create a colored version using a custom palette (magma-like)
        heatmap_colored = Image.new("RGB", heatmap.size)
        pixels = heatmap.load()
        colored_pixels = heatmap_colored.load()
        for y in range(heatmap.size[1]):
            for x_p in range(heatmap.size[0]):
                v = pixels[x_p, y]
                # Simple color mapping: blue -> red
                r_c = int(255 * (v / 255.0))
                b_c = int(255 * (1.0 - v / 255.0))
                g_c = int(128 * (1.0 - abs(v - 128) / 128.0))
                colored_pixels[x_p, y] = (r_c, g_c, b_c)

        # Blend with original
        blended = Image.blend(image.convert("RGB"), heatmap_colored, alpha=0.5)
        
        # To Base64
        buffered = io.BytesIO()
        blended.save(buffered, format="JPEG")
        return "data:image/jpeg;base64," + base64.b64encode(buffered.getvalue()).decode()

    except Exception as e:
        print(f"Grad-CAM Error: {e}")
        return None
    finally:
        handle_act.remove()
        handle_grad.remove()


def artifacts_exist(artifacts: ModelArtifacts) -> bool:
    return os.path.exists(artifacts.weights_path) and os.path.exists(artifacts.classes_path)

