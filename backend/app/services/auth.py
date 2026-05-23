"""
backend/app/services/auth.py

Utilidades de autenticacion JWT para admins de empresa.
"""

import os
from datetime import datetime, timedelta

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Company

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "cambia-esto-en-produccion")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(company_id: int) -> str:
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {"sub": str(company_id), "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_company(
    authorization: str = Header(..., alias="Authorization"),
    db: Session = Depends(get_db),
) -> Company:
    """
    Dependency de FastAPI. Valida el Bearer token y retorna la Company.
    Uso: company: Company = Depends(get_current_company)
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token de autorizacion requerido.")
    token = authorization.removeprefix("Bearer ").strip()
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        company_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Token invalido o expirado.")

    company = db.query(Company).filter(Company.id == company_id).first()
    if company is None:
        raise HTTPException(status_code=401, detail="Empresa no encontrada.")
    return company
