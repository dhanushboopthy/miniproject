from datetime import datetime, date
from pydantic import BaseModel
from typing import List, Dict, Optional


class ChildNutritionStatus(BaseModel):
    child_id: str
    name: str
    age_months: int
    latest_status: str  # SAM, MAM, Normal, Unknown
    latest_measurement_date: Optional[datetime]
    latest_whz: Optional[float]


class AWCMonthlyReport(BaseModel):
    """Monthly report for a single AWC."""
    awc_code: str
    awc_name: str
    month: str  # YYYY-MM
    year: int
    total_children: int
    measured_children: int
    sam_count: int
    mam_count: int
    normal_count: int
    sam_percentage: float
    mam_percentage: float
    normal_percentage: float
    total_alerts: int
    critical_alerts: int
    children_status: List[ChildNutritionStatus]
    generated_at: datetime


class BlockSummary(BaseModel):
    """Aggregated report across AWCs in a block."""
    block_name: str
    month: str  # YYYY-MM
    awc_count: int
    total_children: int
    measured_children: int
    total_sam: int
    total_mam: int
    total_normal: int
    sam_percentage: float
    mam_percentage: float
    total_alerts: int
    critical_alerts: int
    awc_breakdowns: List[Dict]  # List of AWC summary dicts


class NutritionTrendData(BaseModel):
    """Data for trend charts (weekly/monthly aggregation)."""
    date: date
    sam_count: int
    mam_count: int
    normal_count: int
    measurements_done: int


class ReportExportRequest(BaseModel):
    awc_code: Optional[str] = None
    year: int
    month: int
    format: str = "pdf"  # pdf or xlsx


class ReportExportResponse(BaseModel):
    download_url: str
    filename: str
    generated_at: datetime
