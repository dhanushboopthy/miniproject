from datetime import datetime, timedelta, date
from typing import List, Optional, Dict
from app.database import get_db
from app.reports.models import (
    AWCMonthlyReport,
    ChildNutritionStatus,
    BlockSummary,
    NutritionTrendData,
)


async def get_awc_monthly_report(
    awc_code: str,
    year: int,
    month: int
) -> AWCMonthlyReport:
    """
    Generate monthly nutrition report for an AWC.
    Aggregates all measurements for the month and calculates statistics.
    """
    db = get_db()

    # Get AWC details
    awc = await db.awc_centers.find_one({"awc_code": awc_code})
    awc_name = awc.get("center_name", awc_code) if awc else awc_code

    # Determine date range for the month
    start_date = datetime(year, month, 1)
    if month == 12:
        end_date = datetime(year + 1, 1, 1)
    else:
        end_date = datetime(year, month + 1, 1)

    # Get all children in AWC
    children = await db.children.find(
        {"awc_code": awc_code}
    ).to_list(length=None)
    total_children = len(children)

    # Get measurements for this month
    measurements = await db.growth_records.find({
        "awc_code": awc_code,
        "measurement_date": {"$gte": start_date, "$lt": end_date}
    }).to_list(length=None)

    # Group by child and get latest measurement for the month
    child_latest = {}
    for m in measurements:
        child_id = m["child_id"]
        if child_id not in child_latest:
            child_latest[child_id] = m
        elif m["measurement_date"] > child_latest[child_id]["measurement_date"]:
            child_latest[child_id] = m

    measured_children = len(child_latest)

    # Count status distribution
    sam_count = sum(1 for m in child_latest.values() if m.get("wfh_status") == "SAM")
    mam_count = sum(1 for m in child_latest.values() if m.get("wfh_status") == "MAM")
    normal_count = sum(1 for m in child_latest.values() if m.get("wfh_status") == "Normal")

    sam_percentage = (sam_count / measured_children * 100) if measured_children > 0 else 0
    mam_percentage = (mam_count / measured_children * 100) if measured_children > 0 else 0
    normal_percentage = (normal_count / measured_children * 100) if measured_children > 0 else 0

    # Get alerts for this month
    alerts = await db.alerts.find({
        "awc_code": awc_code,
        "created_at": {"$gte": start_date, "$lt": end_date}
    }).to_list(length=None)

    total_alerts = len(alerts)
    critical_alerts = sum(1 for a in alerts if a.get("severity") == "critical")

    # Build child status list
    children_status = []
    for child in children:
        child_id = str(child.get("_id", ""))
        measurement = child_latest.get(child_id)

        if measurement:
            # Calculate age at measurement
            child_dob = child.get("date_of_birth")
            measure_date = measurement.get("measurement_date")
            age_months = 0
            if child_dob and measure_date:
                delta = measure_date - child_dob
                age_months = delta.days // 30

            children_status.append(ChildNutritionStatus(
                child_id=child_id,
                name=child.get("name", "Unknown"),
                age_months=age_months,
                latest_status=measurement.get("wfh_status", "Unknown"),
                latest_measurement_date=measurement.get("measurement_date"),
                latest_whz=measurement.get("whz"),
            ))

    report = AWCMonthlyReport(
        awc_code=awc_code,
        awc_name=awc_name,
        month=f"{year}-{month:02d}",
        year=year,
        total_children=total_children,
        measured_children=measured_children,
        sam_count=sam_count,
        mam_count=mam_count,
        normal_count=normal_count,
        sam_percentage=round(sam_percentage, 2),
        mam_percentage=round(mam_percentage, 2),
        normal_percentage=round(normal_percentage, 2),
        total_alerts=total_alerts,
        critical_alerts=critical_alerts,
        children_status=children_status,
        generated_at=datetime.utcnow(),
    )

    return report


async def get_block_summary(
    block_code: str,
    year: int,
    month: int
) -> BlockSummary:
    """
    Generate monthly report for all AWCs in a block.
    Aggregates across multiple AWC centers.
    """
    db = get_db()

    # Get all AWCs in the block
    awcs = await db.awc_centers.find({
        "block_code": block_code
    }).to_list(length=None)

    if not awcs:
        raise ValueError(f"No AWCs found for block {block_code}")

    awc_codes = [awc["awc_code"] for awc in awcs]

    # Generate report for each AWC
    awc_reports = []
    for awc_code in awc_codes:
        try:
            report = await get_awc_monthly_report(awc_code, year, month)
            awc_reports.append(report)
        except Exception as e:
            # Skip AWCs with errors
            continue

    # Aggregate across all AWCs
    total_children = sum(r.total_children for r in awc_reports)
    measured_children = sum(r.measured_children for r in awc_reports)
    total_sam = sum(r.sam_count for r in awc_reports)
    total_mam = sum(r.mam_count for r in awc_reports)
    total_normal = sum(r.normal_count for r in awc_reports)
    total_alerts = sum(r.total_alerts for r in awc_reports)
    critical_alerts = sum(r.critical_alerts for r in awc_reports)

    sam_percentage = (total_sam / measured_children * 100) if measured_children > 0 else 0
    mam_percentage = (total_mam / measured_children * 100) if measured_children > 0 else 0

    awc_breakdowns = [
        {
            "awc_code": r.awc_code,
            "awc_name": r.awc_name,
            "measured_children": r.measured_children,
            "sam_count": r.sam_count,
            "mam_count": r.mam_count,
            "normal_count": r.normal_count,
        }
        for r in awc_reports
    ]

    block_summary = BlockSummary(
        block_name=block_code,
        month=f"{year}-{month:02d}",
        awc_count=len(awcs),
        total_children=total_children,
        measured_children=measured_children,
        total_sam=total_sam,
        total_mam=total_mam,
        total_normal=total_normal,
        sam_percentage=round(sam_percentage, 2),
        mam_percentage=round(mam_percentage, 2),
        total_alerts=total_alerts,
        critical_alerts=critical_alerts,
        awc_breakdowns=awc_breakdowns,
    )

    return block_summary


async def get_nutrition_trend(
    awc_code: str,
    days: int = 30
) -> List[NutritionTrendData]:
    """
    Get nutrition status trend for last N days.
    Aggregated by day.
    """
    db = get_db()

    start_date = datetime.utcnow() - timedelta(days=days)

    # Get all measurements for the period
    measurements = await db.growth_records.find({
        "awc_code": awc_code,
        "measurement_date": {"$gte": start_date}
    }).sort("measurement_date", 1).to_list(length=None)

    # Group by date and count statuses
    trend_dict = {}
    for m in measurements:
        measure_date = m["measurement_date"].date()
        if measure_date not in trend_dict:
            trend_dict[measure_date] = {
                "sam": 0,
                "mam": 0,
                "normal": 0,
                "measurements": 0
            }

        status = m.get("wfh_status", "Unknown")
        if status == "SAM":
            trend_dict[measure_date]["sam"] += 1
        elif status == "MAM":
            trend_dict[measure_date]["mam"] += 1
        elif status == "Normal":
            trend_dict[measure_date]["normal"] += 1

        trend_dict[measure_date]["measurements"] += 1

    # Convert to list of NutritionTrendData
    trend_data = [
        NutritionTrendData(
            date=date_key,
            sam_count=data["sam"],
            mam_count=data["mam"],
            normal_count=data["normal"],
            measurements_done=data["measurements"],
        )
        for date_key, data in sorted(trend_dict.items())
    ]

    return trend_data
