import json
import unittest
from types import SimpleNamespace
from unittest.mock import patch
from urllib.parse import urlparse

from data.assistant_knowledge import KNOWLEDGE, SOURCES
from services.farming_assistant import AssistantProviderError, FarmingAssistantService


def response_payload(answer, source_ids, out_of_scope=False):
    text = json.dumps(
        {
            "answer": answer,
            "sourceIds": source_ids,
            "outOfScope": out_of_scope,
            "suggestedQuestions": [],
        }
    )
    return {
        "candidates": [
            {"content": {"role": "model", "parts": [{"text": text}]}}
        ]
    }


class FarmingAssistantTests(unittest.TestCase):
    def setUp(self):
        self.service = FarmingAssistantService()
        self.settings = SimpleNamespace(gemini_api_key="test-key", gemini_model="test-model")

    def test_all_knowledge_uses_only_approved_rrdi_or_irri_sources(self):
        self.assertTrue(KNOWLEDGE)
        for document in KNOWLEDGE:
            self.assertTrue(document["sourceIds"])
            for source_id in document["sourceIds"]:
                self.assertIn(source_id, SOURCES)
        for source in SOURCES.values():
            hostname = urlparse(source["url"]).hostname
            self.assertIn(hostname, {"doa.gov.lk", "www.knowledgebank.irri.org"})

    def test_returns_only_validated_source_metadata(self):
        payload = response_payload("Use recommended nitrogen and monitor the field.", ["rrdi-blast"])
        with patch("services.farming_assistant.settings", self.settings), patch.object(
            self.service, "_create_response", return_value=payload
        ) as create_response:
            result = self.service.ask("How do I manage blast?", "en", [])

        self.assertEqual(result["sources"][0]["id"], "rrdi-blast")
        self.assertEqual(result["model"], "test-model")
        self.assertEqual(result["provider"], "Google Gemini")
        request = create_response.call_args.args[0]
        self.assertEqual(
            request["generationConfig"]["responseMimeType"], "application/json"
        )
        self.assertIn("responseJsonSchema", request["generationConfig"])
        self.assertEqual(
            request["generationConfig"]["thinkingConfig"]["thinkingLevel"], "LOW"
        )
        self.assertIn("systemInstruction", request)

    def test_retries_once_when_gemini_returns_incomplete_json(self):
        incomplete = {
            "candidates": [
                {"content": {"role": "model", "parts": [{"text": '{"answer":"cut'}]}}
            ]
        }
        complete = response_payload("Blast has spindle-shaped leaf lesions.", ["rrdi-blast"])
        with patch("services.farming_assistant.settings", self.settings), patch.object(
            self.service, "_create_response", side_effect=[incomplete, complete]
        ) as create_response:
            result = self.service.ask("What does blast look like?", "en", [])

        self.assertEqual(create_response.call_count, 2)
        self.assertEqual(result["sources"][0]["id"], "rrdi-blast")

    def test_rejects_grounded_answer_without_a_source(self):
        payload = response_payload("Unsupported answer", [])
        with patch("services.farming_assistant.settings", self.settings), patch.object(
            self.service, "_create_response", return_value=payload
        ):
            with self.assertRaises(AssistantProviderError):
                self.service.ask("Tell me about blast", "en", [])

    def test_allows_out_of_scope_answer_without_citation(self):
        payload = response_payload("I can only answer rice-health questions.", [], out_of_scope=True)
        with patch("services.farming_assistant.settings", self.settings), patch.object(
            self.service, "_create_response", return_value=payload
        ):
            result = self.service.ask("Who won the match?", "en", [])

        self.assertTrue(result["outOfScope"])
        self.assertEqual(result["sources"], [])

    def test_language_instruction_is_explicit(self):
        self.assertIn("Sinhala (සිංහල) only", self.service._instructions("si"))
        self.assertIn("Tamil (தமிழ்) only", self.service._instructions("ta"))


if __name__ == "__main__":
    unittest.main()
