from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError

from ..database import get_db, serialize_id, to_object_id
from .service import decode_token


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    try:
        payload = decode_token(token)
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        ) from exc

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token subject")

    db = get_db()
    user = await db.users.find_one({"_id": to_object_id(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return serialize_id(user)


def require_role(*roles: str):
    async def _require_role(user: dict = Depends(get_current_user)) -> dict:
        if user.get("role") not in roles:
            raise HTTPException(status_code=403, detail="Forbidden")
        return user

    return _require_role


def require_awc_access(awc_code: str, user: dict) -> None:
    user_awc = (user.get("awc_code") or "").strip()
    target_awc = (awc_code or "").strip()
    if user.get("role") == "worker" and user_awc != target_awc:
        raise HTTPException(status_code=403, detail="AWC access denied")
