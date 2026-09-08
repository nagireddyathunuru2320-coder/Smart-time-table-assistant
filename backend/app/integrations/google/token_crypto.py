"""Symmetric encryption for OAuth tokens at rest.

Derives a Fernet key from the app's SECRET_KEY via SHA-256, so no separate
encryption key needs to be managed. Rotating SECRET_KEY will make
previously encrypted tokens undecryptable - affected users would need to
reconnect their calendar.
"""
from __future__ import annotations

import base64
import hashlib

from cryptography.fernet import Fernet

from app.config import settings


def _get_fernet() -> Fernet:
    key_bytes = hashlib.sha256(settings.secret_key.encode("utf-8")).digest()
    fernet_key = base64.urlsafe_b64encode(key_bytes)
    return Fernet(fernet_key)


def encrypt_token(plain_text: str) -> str:
    return _get_fernet().encrypt(plain_text.encode("utf-8")).decode("utf-8")


def decrypt_token(cipher_text: str) -> str:
    return _get_fernet().decrypt(cipher_text.encode("utf-8")).decode("utf-8")
