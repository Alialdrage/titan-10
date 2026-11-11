import os
import unittest
from unittest.mock import patch

from fastapi import HTTPException
from pydantic import ValidationError

from main import CrewRequest, require_service_token


class CrewRequestTests(unittest.TestCase):
    def test_topic_is_trimmed(self):
        self.assertEqual(CrewRequest(topic="  بحث الذكاء الاصطناعي  ").topic, "بحث الذكاء الاصطناعي")

    def test_whitespace_only_topic_is_rejected(self):
        with self.assertRaises(ValidationError):
            CrewRequest(topic="   ")

    def test_extra_fields_are_rejected(self):
        with self.assertRaises(ValidationError):
            CrewRequest(topic="موضوع صالح", unexpected="value")


class ServiceTokenTests(unittest.TestCase):
    def test_missing_server_token_returns_503(self):
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(HTTPException) as raised:
                require_service_token("Bearer supplied")
        self.assertEqual(raised.exception.status_code, 503)

    def test_short_server_token_returns_503(self):
        with patch.dict(os.environ, {"CREW_API_TOKEN": "too-short"}, clear=True):
            with self.assertRaises(HTTPException) as raised:
                require_service_token("Bearer too-short")
        self.assertEqual(raised.exception.status_code, 503)

    def test_wrong_token_returns_401(self):
        expected = "x" * 40
        with patch.dict(os.environ, {"CREW_API_TOKEN": expected}, clear=True):
            with self.assertRaises(HTTPException) as raised:
                require_service_token("Bearer wrong")
        self.assertEqual(raised.exception.status_code, 401)

    def test_matching_bearer_token_is_accepted(self):
        expected = "x" * 40
        with patch.dict(os.environ, {"CREW_API_TOKEN": expected}, clear=True):
            self.assertIsNone(require_service_token(f"Bearer {expected}"))


if __name__ == "__main__":
    unittest.main()
