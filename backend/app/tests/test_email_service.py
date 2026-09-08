from unittest.mock import MagicMock, patch

import pytest

from app.config import settings
from app.services.email_service import send_email


def test_send_email_raises_if_not_configured(monkeypatch):
    monkeypatch.setattr(settings, "smtp_host", "")
    monkeypatch.setattr(settings, "smtp_username", "")
    with pytest.raises(RuntimeError):
        send_email("test@example.com", "Subject", "Body")


def test_send_email_calls_smtp_when_configured(monkeypatch):
    monkeypatch.setattr(settings, "smtp_host", "smtp.example.com")
    monkeypatch.setattr(settings, "smtp_port", 587)
    monkeypatch.setattr(settings, "smtp_username", "user@example.com")
    monkeypatch.setattr(settings, "smtp_password", "app-password")
    monkeypatch.setattr(settings, "smtp_from_email", "user@example.com")
    monkeypatch.setattr(settings, "smtp_use_tls", True)

    mock_server = MagicMock()
    mock_smtp_cls = MagicMock()
    mock_smtp_cls.return_value.__enter__.return_value = mock_server

    with patch("smtplib.SMTP", mock_smtp_cls):
        send_email("test@example.com", "Subject", "Body")

    mock_server.starttls.assert_called_once()
    mock_server.login.assert_called_once_with("user@example.com", "app-password")
    mock_server.sendmail.assert_called_once()
