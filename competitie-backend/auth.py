import bcrypt
from jose import jwt
from datetime import datetime, timedelta
from typing import Optional
import os

SECRET_KEY = os.getenv("SECRET_KEY", "een-geheime-sleutel-verander-dit")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def truncate_password(password: str) -> str:
    """Zorg dat wachtwoord niet langer is dan 72 bytes (bcrypt-limiet)."""
    encoded = password.encode('utf-8')
    if len(encoded) <= 72:
        return password
    return encoded[:72].decode('utf-8', errors='ignore')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifieer wachtwoord met bcrypt."""
    plain_password = truncate_password(plain_password)
    return bcrypt.checkpw(
        plain_password.encode('utf-8'),
        hashed_password.encode('utf-8')
    )

def get_password_hash(password: str) -> str:
    """Genereer bcrypt-hash voor wachtwoord."""
    password = truncate_password(password)
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
