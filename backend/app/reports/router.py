from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from datetime import datetime
from typing import Optional
from app.auth.dependencies import get_current_user
from app.reports.models import AWCMonthlyReport, BlockSummary, NutritionTrendData
from app.reports.service import (
    get_awc_monthly_report,
    get_block_summary,
    get_nutrition_trend,
)

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/awc/monthly", response_model=AWCMonthlyReport)
async def get_awc_report(
    year: int = Query(datetime.now().year),
    month: int = Query(datetime.now().month),
    current_user: dict = Depends(get_current_user),
):
    """
    Get monthly nutrition report for an AWC.
    Workers see their own AWC; supervisors can view any AWC in their sector.
    """
    awc_code = current_user.get("awc_code")
    if not awc_code:
        raise HTTPException(status_code=403, detail="User has no AWC assigned")
    
    try:
        report = await get_awc_monthly_report(awc_code, year, month)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/block/summary", response_model=BlockSummary)
async def get_block_report(
    block_code: str = Query(...),
    year: int = Query(datetime.now().year),
    month: int = Query(datetime.now().month),
    current_user: dict = Depends(get_current_user),
):
    """
    Get aggregated report for all AWCs in a block.
    Requires supervisor or CDPO role.
    """
    # Verify user has access to view block reports
    user_role = current_user.get("role")
    if user_role not in ["supervisor", "cdpo", "district", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    try:
        report = await get_block_summary(block_code, year, month)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/nutrition/trend", response_model=list[NutritionTrendData])
async def get_trend(
    days: int = Query(30, ge=7, le=365),
    current_user: dict = Depends(get_current_user),
):
    """
    Get nutrition status trend for last N days.
    Used for line charts showing SAM/MAM/Normal counts over time.
    """
    awc_code = current_user.get("awc_code")
    if not awc_code:
        raise HTTPException(status_code=403, detail="User has no AWC assigned")
    
    try:
        trend = await get_nutrition_trend(awc_code, days)
        return trend
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/awc/export")
async def export_awc_report(
    year: int = Query(datetime.now().year),
    month: int = Query(datetime.now().month),
    format: str = Query("pdf", regex="^(pdf|xlsx)$"),
    current_user: dict = Depends(get_current_user),
):
    """
    Export AWC report as PDF or Excel.
    Returns file for download.
    """
    awc_code = current_user.get("awc_code")
    if not awc_code:
        raise HTTPException(status_code=403, detail="User has no AWC assigned")
    
    try:
        report = await get_awc_monthly_report(awc_code, year, month)

        if format == "pdf":
            # TODO: Generate PDF using WeasyPrint
            filename = f"AWC_{awc_code}_{year}_{month:02d}.pdf"
            return {"message": "PDF export feature coming soon"}

        elif format == "xlsx":
            # TODO: Generate Excel using openpyxl
            filename = f"AWC_{awc_code}_{year}_{month:02d}.xlsx"
            return {"message": "Excel export feature coming soon"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
