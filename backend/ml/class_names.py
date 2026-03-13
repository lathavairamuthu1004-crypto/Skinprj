import re
from typing import Dict, List, Tuple


def _norm(s: str) -> str:
    s = str(s).strip().lower()
    s = s.replace("_", " ").replace("-", " ")
    s = re.sub(r"\s+", " ", s)
    return s


def _default_aliases() -> Dict[str, str]:
    # Map common dataset folder names / abbreviations to SkinMorph canonical names.
    return {
        _norm("acne"): "Acne Vulgaris",
        _norm("acne vulgaris"): "Acne Vulgaris",
        _norm("eczema"): "Eczema (Atopic Dermatitis)",
        _norm("atopic dermatitis"): "Eczema (Atopic Dermatitis)",
        _norm("psoriasis"): "Psoriasis",
        _norm("rosacea"): "Rosacea",
        _norm("seborrheic keratosis"): "Seborrheic Keratosis",
        _norm("seborrheic_keratosis"): "Seborrheic Keratosis",
        _norm("melanoma"): "Melanoma",
        _norm("melanoma suspect"): "Melanoma",
        _norm("melanoma_suspect"): "Melanoma",
        _norm("mel"): "Melanoma",
        _norm("benign nevus"): "Benign Nevus",
        _norm("benign_nevus"): "Benign Nevus",
        _norm("nevus"): "Benign Nevus",
        _norm("nv"): "Benign Nevus",
        _norm("basal cell carcinoma"): "Basal Cell Carcinoma",
        _norm("bcc"): "Basal Cell Carcinoma",
        _norm("squamous cell carcinoma"): "Squamous Cell Carcinoma",
        _norm("scc"): "Squamous Cell Carcinoma",
        _norm("actinic keratosis"): "Actinic Keratosis",
        _norm("ak"): "Actinic Keratosis",
        _norm("akiec"): "Actinic Keratosis",
        _norm("bkl"): "Seborrheic Keratosis",
        _norm("df"): "Dermatofibroma",
        _norm("vasc"): "Urticaria (Hives)", # Closest fit for vascular lesions in this list
        _norm("ringworm"): "Tinea Corporis (Ringworm)",
        _norm("tinea"): "Tinea Corporis (Ringworm)",
        _norm("shingles"): "Herpes Zoster (Shingles)",
        _norm("chickenpox"): "Varicella (Chickenpox)",
        _norm("hives"): "Urticaria (Hives)",
        _norm("wart"): "Viral Warts",
        _norm("warts"): "Viral Warts",
    }


def build_canonicalizer(canonical_names: List[str]) -> Tuple[Dict[str, str], Dict[str, str]]:
    """
    Returns (norm_to_canonical, canonical_to_canonical) where keys are normalized strings.
    """
    norm_to_canonical: Dict[str, str] = {}
    for name in canonical_names:
        norm_to_canonical[_norm(name)] = name
    # aliases override only if target exists in canonicals
    aliases = _default_aliases()
    for k_norm, target in aliases.items():
        if _norm(target) in norm_to_canonical:
            norm_to_canonical[k_norm] = target
    return norm_to_canonical, {k: v for k, v in norm_to_canonical.items()}


def canonicalize_classes(dataset_classes: List[str], canonical_names: List[str]) -> Tuple[List[str], Dict[str, str]]:
    """
    Attempts to map dataset folder names to canonical disease names.
    If no match is found, keeps the original dataset class name.

    Returns (classes_for_training, mapping_original_to_used).
    """
    norm_to_canonical, _ = build_canonicalizer(canonical_names)
    mapping: Dict[str, str] = {}
    used: List[str] = []
    for c in dataset_classes:
        norm = _norm(c)
        mapped = norm_to_canonical.get(norm)
        if mapped is None:
            mapped = c
        mapping[c] = mapped
        used.append(mapped)
    return used, mapping

