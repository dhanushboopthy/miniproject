import asyncio
import json
from typing import Optional
import httpx

from ..config import settings


class OpenRouterClient:
    def __init__(self):
        self.base_url = settings.openrouter_base_url
        self.api_key = settings.openrouter_api_key
        self.primary_model = settings.openrouter_primary_model
        self.fallback_model = settings.openrouter_fallback_model

    async def analyze_nutrition(
        self,
        child_name: str,
        age_months: int,
        weight_kg: float,
        height_cm: float,
        muac_cm: float,
        status: str,
        diet_log: list[dict],
    ) -> dict:
        prompt = self._build_prompt(
            child_name, age_months, weight_kg, height_cm, muac_cm, status, diet_log
        )
        
        for attempt, model in enumerate([self.primary_model, self.fallback_model]):
            try:
                return await self._call_openrouter(prompt, model)
            except Exception as e:
                if attempt == 1:
                    raise
                await asyncio.sleep(2 ** attempt)

    async def _call_openrouter(self, prompt: str, model: str) -> dict:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.7,
                },
            )
            response.raise_for_status()
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            try:
                analysis = json.loads(content)
                analysis["model_used"] = model
                return analysis
            except json.JSONDecodeError:
                raise ValueError(f"Invalid JSON from AI: {content}")

    def _build_prompt(
        self,
        child_name: str,
        age_months: int,
        weight_kg: float,
        height_cm: float,
        muac_cm: float,
        status: str,
        diet_log: list[dict],
    ) -> str:
        age_years = age_months // 12
        diet_str = "\n".join([f"- {item['name']}: {item['quantity_g']}g" for item in diet_log])
        return f"""You are a pediatric nutritionist supporting ICDS (Integrated Child Development Services) workers in Tamil Nadu, India.

Child Profile:
- Name: {child_name}
- Age: {age_months} months ({age_years} years)
- Weight: {weight_kg} kg | Height: {height_cm} cm
- MUAC: {muac_cm} cm
- Current Growth Status: {status}
- Last 7 days diet log:
{diet_str}
- Region: Tamil Nadu, India

Tasks:
1. Identify the top 3 nutrient deficiencies with severity (mild/moderate/severe)
2. For each deficiency, suggest 3 locally available, affordable Tamil Nadu foods
3. Generate a 7-day meal plan using ICDS supplementary nutrition guidelines (consider foods like ragi, moringa, horsegram, tamarind, sesame, drumstick)
4. Flag if child needs immediate medical referral (true/false with reason)

Respond ONLY in the following JSON format with no additional text:
{{
  "deficiencies": [
    {{ "nutrient": "Iron", "severity": "moderate", "foods": ["Moringa leaves", "Sesame seeds", "Horsegram"] }}
  ],
  "meal_plan": [
    {{ "day": "Monday", "breakfast": "...", "lunch": "...", "snack": "...", "dinner": "..." }}
  ],
  "referral_needed": false,
  "referral_reason": null,
  "summary": "Brief 2-sentence summary for the Anganwadi worker"
}}
"""


openrouter_client = OpenRouterClient()
