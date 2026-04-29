import asyncio
import json
from pathlib import Path
import sys

# Ensure /app (backend root in container) or local backend folder is on sys.path.
backend_root = Path(__file__).resolve().parents[1]
sys.path.append(str(backend_root))

from app.nutrition.openrouter_client import openrouter_client


def build_sample_diet():
    return [
        {"name": "Dosa", "quantity_g": 150},
        {"name": "Sambar", "quantity_g": 200},
    ]


async def main():
    analysis = await openrouter_client.analyze_nutrition(
        child_name="Test Child",
        age_months=24,
        weight_kg=10.5,
        height_cm=82.0,
        muac_cm=13.0,
        status="Normal",
        diet_log=build_sample_diet(),
    )
    print(json.dumps(analysis, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
