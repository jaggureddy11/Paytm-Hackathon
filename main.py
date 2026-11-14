import os
from pathlib import Path
from sarvamai import SarvamAI

# Load environment variables from .env if present
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

if not os.getenv("SARVAM_API_KEY"):
    env_file = Path(__file__).parent / ".env"
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip("'\""))

api_key = os.getenv("SARVAM_API_KEY")
if not api_key:
    raise RuntimeError("SARVAM_API_KEY is not set. Please add your API key to .env")

client = SarvamAI(api_subscription_key=api_key)

response = client.chat.completions(
    model="sarvam-105b-conversations",
    messages=[
        {"role": "user", "content": "Hello! Please give a brief, friendly greeting."}
    ],
)

print(response.choices[0].message.content)
