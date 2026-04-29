import json
import httpx

from ..config import settings


class GeminiClient:
    def __init__(self):
        self.base_url = settings.gemini_base_url.rstrip("/")
        self.api_key = settings.gemini_api_key
        self.model = settings.gemini_model

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
        if settings.gemini_mock or not self.api_key:
            return self._mock_analysis(child_name, status)
        prompt = self._build_prompt(
            child_name, age_months, weight_kg, height_cm, muac_cm, status, diet_log
        )
        return await self._call_gemini(prompt)

    async def _call_gemini(self, prompt: str) -> dict:
        url = f"{self.base_url}/models/{self.model}:generateContent"
        params = {"key": self.api_key}
        payload = {
            "contents": [
                {"role": "user", "parts": [{"text": prompt}]},
            ],
            "generationConfig": {
                "temperature": 0.7,
            },
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, params=params, json=payload)
            if response.status_code >= 400:
                raise RuntimeError(
                    f"Gemini error {response.status_code}: {response.text}"
                )
            data = response.json()

        candidates = data.get("candidates", [])
        if not candidates:
            raise RuntimeError("Gemini returned no candidates")

        parts = candidates[0].get("content", {}).get("parts", [])
        if not parts or "text" not in parts[0]:
            raise RuntimeError("Gemini response missing text content")

        content = parts[0]["text"]
        try:
            analysis = json.loads(content)
            analysis["model_used"] = self.model
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
        diet_str = "\n".join(
            [f"- {item['name']}: {item['quantity_g']}g" for item in diet_log]
        )
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

    def _mock_analysis(self, child_name: str, status: str) -> dict:
        return {
            "deficiencies": [
                {
                    "nutrient": "Iron",
                    "severity": "moderate",
                    "foods": ["Moringa leaves", "Sesame seeds", "Horsegram"],
                },
                {
                    "nutrient": "Vitamin A",
                    "severity": "mild",
                    "foods": ["Carrot", "Drumstick leaves", "Pumpkin"],
                },
                {
                    "nutrient": "Protein",
                    "severity": "moderate",
                    "foods": ["Egg", "Lentils", "Groundnut"],
                },
            ],
            "meal_plan": [
                {
                    "day": "Monday",
                    "breakfast": "Ragi dosa with sambar",
                    "lunch": "Rice, dal, and vegetable curry",
                    "snack": "Banana",
                    "dinner": "Idli with chutney",
                }
            ],
            "referral_needed": False,
            "referral_reason": None,
            "summary": f"Mock analysis for {child_name}. Current status: {status}.",
            "model_used": "mock",
        }


gemini_client = GeminiClient()
