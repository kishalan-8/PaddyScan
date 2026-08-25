import unittest
from io import BytesIO
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient
from PIL import Image

from routes.prediction import router
from routes.prediction import _aggregate_predictions
from services.inference import NoPaddyLeafError


def accepted_photo(index, disease, confidence, probabilities):
    return {
        "inputIndex": index,
        "filename": f"leaf-{index}.jpg",
        "accepted": True,
        "disease": disease,
        "classificationConfidence": confidence,
        "detectionConfidence": 0.8 + (index * 0.05),
        "boundingBox": {"x1": 1, "y1": 2, "x2": 20, "y2": 30, "width": 19, "height": 28},
        "imageSize": {"width": 100, "height": 100},
        "topPredictions": [],
        "leafDetected": True,
        "_classProbabilities": probabilities,
    }


def model_result(disease, probabilities):
    ranked = sorted(probabilities.items(), key=lambda item: item[1], reverse=True)
    return {
        "disease": disease,
        "classificationConfidence": probabilities[disease],
        "detectionConfidence": 0.9,
        "leafDetected": True,
        "boundingBox": {"x1": 1, "y1": 2, "x2": 20, "y2": 30, "width": 19, "height": 28},
        "topPredictions": [
            {"disease": name, "confidence": confidence}
            for name, confidence in ranked[:3]
        ],
        "classProbabilities": probabilities,
        "imageSize": {"width": 64, "height": 64},
    }


def jpeg_bytes():
    output = BytesIO()
    Image.new("RGB", (64, 64), "green").save(output, format="JPEG")
    return output.getvalue()


class PredictionAggregationTests(unittest.TestCase):
    def test_combines_probability_distributions_when_all_diseases_match(self):
        entries = [
            accepted_photo(0, "brown_spot", 0.7, {"brown_spot": 0.7, "healthy": 0.3}),
            accepted_photo(1, "brown_spot", 0.6, {"brown_spot": 0.6, "healthy": 0.4}),
            accepted_photo(2, "brown_spot", 0.8, {"brown_spot": 0.8, "healthy": 0.2}),
        ]

        result = _aggregate_predictions(entries, photo_count=3)

        self.assertEqual(result["disease"], "brown_spot")
        self.assertAlmostEqual(result["classificationConfidence"], 0.7, places=6)
        self.assertEqual(result["consensusCount"], 3)
        self.assertEqual(result["consensusRatio"], 1.0)
        self.assertEqual(result["primaryPhotoIndex"], 2)
        self.assertTrue(result["isCombinedDiagnosis"])
        self.assertEqual(result["diagnosisMode"], "combined")

    def test_different_diseases_remain_individual_results(self):
        entries = [
            accepted_photo(0, "brown_spot", 0.8, {"brown_spot": 0.8, "rice_stripe": 0.2}),
            accepted_photo(1, "brown_spot", 0.75, {"brown_spot": 0.75, "rice_stripe": 0.25}),
            accepted_photo(2, "rice_stripe", 0.99, {"brown_spot": 0.01, "rice_stripe": 0.99}),
        ]

        result = _aggregate_predictions(entries, photo_count=3)

        self.assertTrue(result["hasMixedDiseases"])
        self.assertFalse(result["isCombinedDiagnosis"])
        self.assertEqual(result["diagnosisMode"], "individual")
        self.assertEqual(result["primaryPhotoIndex"], 2)
        self.assertEqual(result["photos"][0]["disease"], "brown_spot")
        self.assertEqual(result["photos"][2]["disease"], "rice_stripe")
        self.assertIsNone(result["consensusRatio"])

    def test_keeps_rejected_photos_but_excludes_them_from_consensus(self):
        entries = [
            accepted_photo(0, "healthy", 0.9, {"brown_spot": 0.1, "healthy": 0.9}),
            {"inputIndex": 1, "filename": "bad.jpg", "accepted": False, "error": "No leaf"},
        ]

        result = _aggregate_predictions(entries, photo_count=2)

        self.assertEqual(result["analyzedPhotoCount"], 1)
        self.assertEqual(result["rejectedPhotoCount"], 1)
        self.assertEqual(result["diagnosisMode"], "single")
        self.assertFalse(result["isCombinedDiagnosis"])
        self.assertIsNone(result["consensusRatio"])
        self.assertFalse(result["photos"][1]["accepted"])


class PredictionRouteTests(unittest.TestCase):
    def setUp(self):
        app = FastAPI()
        app.include_router(router)
        self.client = TestClient(app)

    def test_multi_photo_request_keeps_different_diseases_separate(self):
        predictions = [
            model_result("brown_spot", {"brown_spot": 0.8, "healthy": 0.2}),
            model_result("healthy", {"brown_spot": 0.2, "healthy": 0.8}),
        ]
        uploads = [
            ("files", ("leaf-1.jpg", jpeg_bytes(), "image/jpeg")),
            ("files", ("leaf-2.jpg", jpeg_bytes(), "image/jpeg")),
        ]

        with patch("routes.prediction.inference_service.predict", side_effect=predictions):
            response = self.client.post("/predict", files=uploads)

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["disease"], "brown_spot")
        self.assertEqual(payload["photoCount"], 2)
        self.assertEqual(payload["analyzedPhotoCount"], 2)
        self.assertTrue(payload["hasMixedDiseases"])
        self.assertFalse(payload["isCombinedDiagnosis"])
        self.assertEqual(payload["photos"][0]["disease"], "brown_spot")
        self.assertEqual(payload["photos"][1]["disease"], "healthy")
        self.assertNotIn("classProbabilities", payload["photos"][0])

    def test_invalid_photo_is_excluded_when_another_photo_is_valid(self):
        predictions = [
            NoPaddyLeafError("No paddy leaf in this photo."),
            model_result("healthy", {"brown_spot": 0.1, "healthy": 0.9}),
        ]
        uploads = [
            ("files", ("invalid.jpg", jpeg_bytes(), "image/jpeg")),
            ("files", ("leaf.jpg", jpeg_bytes(), "image/jpeg")),
        ]

        with patch("routes.prediction.inference_service.predict", side_effect=predictions):
            response = self.client.post("/predict", files=uploads)

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["analyzedPhotoCount"], 1)
        self.assertEqual(payload["rejectedPhotoCount"], 1)
        self.assertFalse(payload["photos"][0]["accepted"])


if __name__ == "__main__":
    unittest.main()
