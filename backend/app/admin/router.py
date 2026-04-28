from fastapi import APIRouter, Depends

from .service import create_awc_center, list_awc_centers, list_users as fetch_users
from ..auth.dependencies import require_role
from ..auth.models import UserCreate
from ..auth.service import create_user


router = APIRouter()


@router.get("/users")
async def list_users(user=Depends(require_role("admin"))):
    return await fetch_users()


@router.post("/users")
async def create_user_admin(payload: UserCreate, user=Depends(require_role("admin"))):
    created = await create_user(payload.model_dump())
    created.pop("hashed_password", None)
    return created


@router.get("/awc-centers")
async def get_awc_centers(user=Depends(require_role("admin", "supervisor"))):
    return await list_awc_centers()


@router.post("/awc-centers")
async def create_awc(payload: dict, user=Depends(require_role("admin"))):
    return await create_awc_center(payload)
