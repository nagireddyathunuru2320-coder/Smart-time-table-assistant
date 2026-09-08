"""Network-free tests for deterministic Google OAuth helpers and token crypto."""
import time

from app.integrations.google.oauth import sign_state, verify_state
from app.integrations.google.token_crypto import decrypt_token, encrypt_token


def test_sign_and_verify_state_round_trip():
    state = sign_state(user_id=42)
    assert verify_state(state) == 42


def test_verify_state_rejects_tampered_signature():
    state = sign_state(user_id=42)
    payload_b64, _ = state.split(".", 1)
    assert verify_state(f"{payload_b64}.deadbeef") is None


def test_verify_state_rejects_malformed_state():
    assert verify_state("not-a-valid-state") is None


def test_verify_state_rejects_expired_state(monkeypatch):
    import app.integrations.google.oauth as oauth_module

    state = sign_state(user_id=42)
    current_time = time.time()
    monkeypatch.setattr(oauth_module.time, "time", lambda: current_time + 700)
    assert verify_state(state) is None


def test_token_encryption_round_trip():
    original = "super-secret-access-token"
    encrypted = encrypt_token(original)
    assert encrypted != original
    assert decrypt_token(encrypted) == original
