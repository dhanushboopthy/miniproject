from fastapi import APIRouter, Depends, HTTPException

from .models import ChildCreate
from .service import create_child, list_children, get_child_by_child_id, list_children_with_status
from ..auth.dependencies import get_current_user, require_awc_access


router = APIRouter()


@router.get("/")
async def get_children(awc_code: str | None = None, user=Depends(get_current_user)):
    filter_query = {}
    if user.get("role") == "worker":
        filter_query["awc_code"] = user.get("awc_code")
    elif awc_code:
        filter_query["awc_code"] = awc_code
    return await list_children(filter_query)


@router.get("/with-status")
async def get_children_with_status(awc_code: str | None = None, user=Depends(get_current_user)):
    filter_query = {}
    if user.get("role") == "worker":
        filter_query["awc_code"] = user.get("awc_code")
    elif awc_code:
        filter_query["awc_code"] = awc_code
    return await list_children_with_status(filter_query)


@router.post("/")
async def register_child(payload: ChildCreate, user=Depends(get_current_user)):
    if user.get("role") not in {"worker", "admin"}:
        raise HTTPException(status_code=403, detail="Forbidden")

    payload.awc_code = payload.awc_code.strip()
    require_awc_access(payload.awc_code, user)
    data = payload.model_dump()
    data["created_by"] = user["id"]
    return await create_child(data)


@router.get("/{child_id}")
async def get_child_profile(child_id: str, user=Depends(get_current_user)):
    child = await get_child_by_child_id(child_id.strip())
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    if user.get("role") == "worker":
        require_awc_access(child.get("awc_code"), user)

    return child
