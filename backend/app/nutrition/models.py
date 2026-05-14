from typing import Optional
from pydantic import BaseModel


class FoodItem(BaseModel):
    name: str
    quantity_g: float


class NutritionLogIn(BaseModel):
    child_id: str
    log_date: str
    food_items: list[FoodItem]


class NutritionAskIn(BaseModel):
    log_id: str
    child_id: str
    question: str


class AIAnalysis(BaseModel):
    deficiencies: list[dict]
    meal_plan: list[dict] | None = None
    referral_needed: bool
    referral_reason: Optional[str] = None
    summary: str
    model_used: str
    score: Optional[int] = None
    caloric_adequacy_pct: Optional[int] = None


class NutritionLogOut(BaseModel):
    id: str
    child_id: str
    log_date: str
    food_items: list[FoodItem]
    ai_analysis: Optional[AIAnalysis] = None
    logged_by: str
    created_at: str
