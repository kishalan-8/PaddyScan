import json
import threading
from pathlib import Path
from typing import Any

from PIL import Image

from config import settings


EXPECTED_CLASSES = [
    "bacterial_leaf_blight",
    "brown_spot",
    "healthy",
    "leaf_blast",
    "leaf_scald",
    "narrow_brown_spot",
    "rice_leaf_folder",
    "rice_stripes",
    "tungro",
]

PADDY_LEAF_LABELS = {"leaf", "paddy leaf", "rice leaf"}


class ModelLoadError(RuntimeError):
    pass


class NoPaddyLeafError(ValueError):
    pass


class InferenceService:
    def __init__(self) -> None:
        self._detector: Any | None = None
        self._classifier: Any | None = None
        self._transform: Any | None = None
        self._torch: Any | None = None
        self._device: Any | None = None
        self._classes: list[str] = EXPECTED_CLASSES.copy()
        self._leaf_class_ids: set[int] = set()
        self._detector_labels: dict[int, str] = {}
        self._lock = threading.Lock()

    @property
    def models_ready(self) -> bool:
        return self._detector is not None and self._classifier is not None

    def model_status(self) -> dict[str, dict[str, Any]]:
        return {
            "detection": {
                "ready": self._detector is not None,
                "fileFound": settings.detector_path.is_file(),
                "expectedPath": str(settings.detector_path),
                "labels": list(self._detector_labels.values()),
                "confidenceThreshold": settings.leaf_detection_confidence,
            },
            "classification": {
                "ready": self._classifier is not None,
                "fileFound": settings.classifier_path.is_file(),
                "expectedPath": str(settings.classifier_path),
            },
        }

    def load_if_available(self) -> bool:
        if self.models_ready:
            return True
        if not settings.detector_path.is_file() or not settings.classifier_path.is_file():
            return False
        try:
            self._load_models()
            return True
        except Exception:
            return False

    def _ensure_models(self) -> None:
        if self.models_ready:
            return

        missing = [
            str(path)
            for path in (settings.detector_path, settings.classifier_path)
            if not path.is_file()
        ]
        if missing:
            formatted = "; ".join(missing)
            raise ModelLoadError(f"Model file missing. Copy the trained weights to: {formatted}")

        try:
            self._load_models()
        except Exception as exc:
            raise ModelLoadError(f"Models could not be loaded: {exc}") from exc

    def _load_models(self) -> None:
        with self._lock:
            if self.models_ready:
                return

            import torch
            from torch import nn
            from torchvision import models, transforms
            from ultralytics import YOLO

            classes = self._read_classes(settings.classes_path)
            device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

            classifier = models.resnet18(weights=None)
            classifier.fc = nn.Linear(classifier.fc.in_features, len(classes))
            checkpoint = torch.load(
                settings.classifier_path, map_location=device, weights_only=True
            )
            state_dict = self._extract_state_dict(checkpoint)
            classifier.load_state_dict(state_dict)
            classifier.to(device)
            classifier.eval()

            transform = transforms.Compose(
                [
                    transforms.Resize((224, 224)),
                    transforms.ToTensor(),
                    transforms.Normalize(
                        mean=[0.485, 0.456, 0.406],
                        std=[0.229, 0.224, 0.225],
                    ),
                ]
            )

            detector = YOLO(str(settings.detector_path))
            detector_labels = self._normalise_detector_names(detector.names)
            leaf_class_ids = {
                class_id
                for class_id, name in detector_labels.items()
                if self._normalise_label(name) in PADDY_LEAF_LABELS
            }
            if not leaf_class_ids:
                labels = ", ".join(detector_labels.values()) or "none"
                raise ValueError(
                    "The YOLOv10 detector must be trained for a leaf/paddy leaf/rice leaf "
                    f"class; found: {labels}. A generic COCO checkpoint is not a paddy-leaf detector."
                )

            self._classes = classes
            self._device = device
            self._torch = torch
            self._classifier = classifier
            self._transform = transform
            self._detector = detector
            self._detector_labels = detector_labels
            self._leaf_class_ids = leaf_class_ids

    @staticmethod
    def _normalise_detector_names(names: Any) -> dict[int, str]:
        if isinstance(names, dict):
            return {int(key): str(value) for key, value in names.items()}
        if isinstance(names, (list, tuple)):
            return {index: str(value) for index, value in enumerate(names)}
        raise ValueError("The YOLOv10 checkpoint does not contain valid class names.")

    @staticmethod
    def _normalise_label(label: str) -> str:
        return " ".join(label.lower().replace("_", " ").replace("-", " ").split())

    @staticmethod
    def _extract_state_dict(checkpoint: Any) -> dict[str, Any]:
        if not isinstance(checkpoint, dict):
            raise ValueError("The ResNet checkpoint is not a valid state dictionary.")

        for key in ("model_state_dict", "state_dict"):
            candidate = checkpoint.get(key)
            if isinstance(candidate, dict):
                checkpoint = candidate
                break

        return {
            key.removeprefix("module."): value for key, value in checkpoint.items()
        }

    @staticmethod
    def _read_classes(path: Path) -> list[str]:
        if path.is_file():
            with path.open("r", encoding="utf-8") as file:
                classes = json.load(file)
        else:
            classes = EXPECTED_CLASSES.copy()

        if classes != EXPECTED_CLASSES:
            raise ValueError(
                "classes.json must contain the nine disease classes in the required order."
            )
        return classes

    def predict(self, image: Image.Image) -> dict[str, Any]:
        self._ensure_models()

        results = self._detector.predict(
            source=image,
            conf=settings.leaf_detection_confidence,
            verbose=False,
        )
        boxes = results[0].boxes if results else None
        selection = self._select_paddy_leaf_box(boxes, image)
        if selection is None:
            threshold = int(settings.leaf_detection_confidence * 100)
            raise NoPaddyLeafError(
                "No paddy leaf was detected with sufficient confidence "
                f"({threshold}% required). Upload a clear, close-up photo of a paddy leaf."
            )

        detection_confidence, coords = selection
        x1, y1, x2, y2 = self._safe_box(coords, image.width, image.height)
        classification_image = image.crop((x1, y1, x2, y2))

        input_tensor = self._transform(classification_image).unsqueeze(0).to(self._device)
        with self._torch.inference_mode():
            logits = self._classifier(input_tensor)
            probabilities = self._torch.softmax(logits, dim=1)[0]
            top_probabilities, top_indices = self._torch.topk(probabilities, k=3)

        class_probabilities = {
            disease: round(float(probabilities[index].item()), 6)
            for index, disease in enumerate(self._classes)
        }

        top_predictions = [
            {
                "disease": self._classes[int(index.item())],
                "confidence": round(float(probability.item()), 6),
            }
            for probability, index in zip(top_probabilities, top_indices)
        ]

        return {
            "disease": top_predictions[0]["disease"],
            "classificationConfidence": top_predictions[0]["confidence"],
            "detectionConfidence": round(detection_confidence, 6),
            "leafDetected": True,
            "boundingBox": {
                "x1": x1,
                "y1": y1,
                "x2": x2,
                "y2": y2,
                "width": x2 - x1,
                "height": y2 - y1,
            },
            "topPredictions": top_predictions,
            "classProbabilities": class_probabilities,
            "imageSize": {"width": image.width, "height": image.height},
        }

    def _select_paddy_leaf_box(
        self, boxes: Any, image: Image.Image
    ) -> tuple[float, list[float]] | None:
        if boxes is None or len(boxes) == 0:
            return None

        width, height = image.size
        image_area = width * height
        candidates: list[tuple[float, list[float]]] = []
        for index in range(len(boxes)):
            box = boxes[index]
            class_id = int(box.cls[0].item())
            confidence = float(box.conf[0].item())
            coords = box.xyxy[0].detach().cpu().tolist()
            x1, y1, x2, y2 = self._safe_box(coords, width, height)
            area_ratio = max(0, x2 - x1) * max(0, y2 - y1) / image_area

            if (
                class_id in self._leaf_class_ids
                and confidence >= settings.leaf_detection_confidence
                and area_ratio >= settings.min_leaf_area_ratio
                and x2 > x1
                and y2 > y1
                and self._has_coherent_leaf_colours(image.crop((x1, y1, x2, y2)))
            ):
                candidates.append((confidence, coords))

        return max(candidates, key=lambda candidate: candidate[0]) if candidates else None

    @staticmethod
    def _has_coherent_leaf_colours(crop: Image.Image) -> bool:
        import cv2
        import numpy as np      

        sample = crop.copy()
        sample.thumbnail((224, 224), Image.Resampling.LANCZOS)
        hsv = np.asarray(sample.convert("HSV"), dtype=np.uint8)
        hue, saturation, value = hsv[..., 0], hsv[..., 1], hsv[..., 2]

        plant_mask = (
            (hue >= 12)
            & (hue <= 115)
            & (saturation >= 45)
            & (value >= 35)
        )
        colour_ratio = float(plant_mask.mean())
        if colour_ratio < settings.min_leaf_colour_ratio:
            return False

        _, components = cv2.connectedComponents(
            plant_mask.astype(np.uint8),
            connectivity=4,
)
        counts = np.bincount(components.ravel())
        largest_component = int(counts[1:].max()) if len(counts) > 1 else 0
        coherent_ratio = largest_component / plant_mask.size
        return coherent_ratio >= settings.min_coherent_leaf_ratio

    @staticmethod
    def _safe_box(
        coords: list[float], width: int, height: int
    ) -> tuple[int, int, int, int]:
        x1 = max(0, min(width, int(coords[0])))
        y1 = max(0, min(height, int(coords[1])))
        x2 = max(0, min(width, int(coords[2])))
        y2 = max(0, min(height, int(coords[3])))
        return x1, y1, x2, y2


inference_service = InferenceService()
