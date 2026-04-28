from pydantic import BaseModel, Field


class MeasurementIn(BaseModel):
    child_id: str
    measurement_date: str
    age_months: int = Field(ge=0)
    weight_kg: float = Field(gt=0)
    height_cm: float = Field(gt=0)
    muac_cm: float = Field(gt=0)


class ZScores(BaseModel):
    waz: float
    haz: float
    whz: float


class GrowthRecordOut(BaseModel):
    id: str
    child_id: str
    measurement_date: str
    age_months: int
    weight_kg: float
    height_cm: float
    muac_cm: float
    z_scores: ZScores
    status: str
    measured_by: str
    created_at: str
