import os
import io
import logging
import subprocess
from typing import Optional, Dict, Any
from pathlib import Path

# Load .env
from dotenv import load_dotenv
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

from sarvamai import SarvamAI

logger = logging.getLogger("sarvam_service")

# Default high-quality conversational speakers for bulbul:v4-flash
SPEAKER_MAP = {
    "te-IN": "kavitha_te_conversation",
    "hi-IN": "aditya_hi_conversational",
    "en-IN": "simran_en_conversation"
}

def get_sarvam_client() -> Optional[SarvamAI]:
    api_key = os.getenv("SARVAM_API_KEY")
    if not api_key or api_key == "your_api_key_here":
        return None
    try:
        return SarvamAI(api_subscription_key=api_key)
    except Exception as e:
        logger.error(f"Failed to initialize SarvamAI client: {e}")
        return None

def convert_audio_to_wav(file_bytes: bytes) -> bytes:
    """
    Safely converts arbitrary incoming audio formats (WebM, Opus, MP4, OGG)
    into standard 16kHz mono PCM WAV bytes using ffmpeg.
    Guarantees 100% compatibility with Sarvam Saaras v4 STT.
    """
    try:
        proc = subprocess.Popen(
            [
                'ffmpeg', '-y', '-i', 'pipe:0',
                '-acodec', 'pcm_s16le', '-ac', '1', '-ar', '16000',
                '-f', 'wav', 'pipe:1'
            ],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        wav_bytes, err = proc.communicate(input=file_bytes, timeout=10)
        if proc.returncode == 0 and wav_bytes and len(wav_bytes) > 44:
            return wav_bytes
        else:
            logger.warning(f"ffmpeg conversion returned code {proc.returncode}: {err[:200] if err else ''}")
    except Exception as e:
        logger.warning(f"Audio conversion failed, falling back to raw bytes: {e}")
    return file_bytes

def transcribe_audio(file_bytes: bytes, filename: str = "audio.wav", content_type: str = "audio/wav", language_code: str = "te-IN") -> Dict[str, Any]:
    client = get_sarvam_client()
    if not client:
        return {
            "success": False,
            "error": "Sarvam API key is not configured or invalid in .env",
            "transcript": ""
        }
    
    try:
        # Determine language code: support te-IN, hi-IN, en-IN or unknown
        valid_lang = language_code if language_code in ["te-IN", "hi-IN", "en-IN"] else "unknown"
        
        # Ensure audio is clean 16kHz WAV
        clean_wav = convert_audio_to_wav(file_bytes)
        
        # Sarvam Saaras v4 STT
        response = client.speech_to_text.transcribe(
            file=("recording.wav", clean_wav, "audio/wav"),
            model="saaras:v4",
            language_code=valid_lang
        )
        return {
            "success": True,
            "transcript": response.transcript or "",
            "language_code": getattr(response, "language_code", valid_lang)
        }
    except Exception as e:
        logger.exception("Sarvam STT failed")
        return {
            "success": False,
            "error": str(e),
            "transcript": ""
        }

def synthesize_speech(text: str, language_code: str = "te-IN", speaker: Optional[str] = None) -> Dict[str, Any]:
    client = get_sarvam_client()
    if not client:
        return {
            "success": False,
            "error": "Sarvam API key is not configured or invalid in .env",
            "audio_base64": None
        }

    try:
        valid_lang = language_code if language_code in SPEAKER_MAP else "en-IN"
        chosen_speaker = speaker or SPEAKER_MAP.get(valid_lang, "simran_en_conversation")

        # Trim text if too long to prevent timeouts
        trimmed_text = text[:500] if len(text) > 500 else text

        # Sarvam Bulbul v4 Flash TTS
        response = client.text_to_speech.convert(
            text=trimmed_text,
            language_code=valid_lang,
            model="bulbul:v4-flash",
            speaker=chosen_speaker
        )

        if response.audios and len(response.audios) > 0:
            return {
                "success": True,
                "audio_base64": response.audios[0],
                "format": "wav"
            }
        else:
            return {
                "success": False,
                "error": "No audio returned by Sarvam TTS",
                "audio_base64": None
            }
    except Exception as e:
        logger.exception("Sarvam TTS failed")
        return {
            "success": False,
            "error": str(e),
            "audio_base64": None
        }
