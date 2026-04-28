from pydantic import BaseModel


class MealPlanIn(BaseModel):
    child_id: str
    week_start: str


class DayMeal(BaseModel):
    day: str
    breakfast: str
    lunch: str
    snack: str
    dinner: str


class MealPlanOut(BaseModel):
    id: str
    child_id: str
    week_start: str
    days: list[DayMeal]
    created_at: str
