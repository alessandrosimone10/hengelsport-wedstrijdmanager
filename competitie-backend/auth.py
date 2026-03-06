from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import os

# In productie haal je deze waarden uit environment variabelen
SECRET_KEY = os.getenv("SECRET_KEY", "een-geheime-sleutel-verander-dit")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def truncate_password(password: str) -> str:
    """Zorg dat wachtwoord niet langer is dan 72 bytes (bcrypt-limiet)."""
    encoded = password.encode('utf-8')
    if len(encoded) <= 72:
        return password
    # Kort in tot 72 bytes en decodeer (verlies geen tekens)
    return encoded[:72].decode('utf-8', errors='ignore')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifieer wachtwoord na eventuele truncatie."""
    plain_password = truncate_password(plain_password)
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Genereer hash voor wachtwoord na truncatie."""
    password = truncate_password(password)
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
