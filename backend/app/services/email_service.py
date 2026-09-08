"""Sends transactional email via SMTP."""
from __future__ import annotations

import smtplib
from email.mime.text import MIMEText

from app.config import settings


def send_email(to_email: str, subject: str, body: str) -> None:
    if not settings.smtp_host or not settings.smtp_username:
        raise RuntimeError("SMTP is not configured (smtp_host/smtp_username missing)")

    message = MIMEText(body)
    message["Subject"] = subject
    message["From"] = settings.smtp_from_email or settings.smtp_username
    message["To"] = to_email

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
        if settings.smtp_use_tls:
            server.starttls()
        server.login(settings.smtp_username, settings.smtp_password)
        server.sendmail(message["From"], [to_email], message.as_string())
