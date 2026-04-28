from typing import Optional
from pydantic import BaseModel, Field


class ChildCreate(BaseModel):
    name: str
    dob: str
    gender: str
    awc_code: str
    parent_name: str
    parent_contact: str
    aadhaar_encrypted: Optional[str] = None


class ChildPublic(BaseModel):
    id: str
    child_id: str
    name: str
    dob: str
    gender: str
    awc_code: str
    parent_name: str
    parent_contact: str
    aadhaar_encrypted: Optional[str] = None
    is_active: bool = True
    created_by: str
    created_at: str
