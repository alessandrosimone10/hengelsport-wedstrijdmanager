from pydantic import BaseModel, EmailStr
from typing import List, Optional, Any
from datetime import datetime  # <-- deze import toevoegen

# ---------- Authentication ----------
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    is_admin: bool

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    id: Optional[int] = None

# ---------- Basis schema's voor competities, deelnemers, vangsten ----------
class CompetitionBase(BaseModel):
    name: str
    date: str
    location: str
    status: str = "upcoming"
    entry_fee: Optional[float] = None
    available_numbers: Optional[List[int]] = None
    prize_distribution: Optional[int] = None
    prize_percentages: Optional[List[float]] = None
    fish_fund_percentage: Optional[float] = None
    custom_prize_pot: Optional[float] = None
    max_participants: Optional[int] = None

    class Config:
        orm_mode = True

class ParticipantBase(BaseModel):
    name: str
    number: Optional[int] = None

    class Config:
        orm_mode = True

class CatchBase(BaseModel):
    species: str
    weight: int
    time: Optional[str] = None

    class Config:
        orm_mode = True

# ---------- Create schemas ----------
class CompetitionCreate(CompetitionBase):
    pass

class ParticipantCreate(ParticipantBase):
    pass

class CatchCreate(CatchBase):
    pass

# ---------- Update schemas ----------
class CompetitionUpdate(BaseModel):
    name: Optional[str] = None
    date: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None
    entry_fee: Optional[float] = None
    available_numbers: Optional[List[int]] = None
    prize_distribution: Optional[int] = None
    prize_percentages: Optional[List[float]] = None
    fish_fund_percentage: Optional[float] = None
    custom_prize_pot: Optional[float] = None
    max_participants: Optional[int] = None

    class Config:
        orm_mode = True

class CompetitionStatusUpdate(BaseModel):
    status: str

# ---------- Pending participants ----------
class PendingParticipantBase(BaseModel):
    name: str
    email: str

class ParticipantCreate(BaseModel):
    name: str
    email: str

class PendingParticipant(PendingParticipantBase):
    id: int
    competition_id: int
    status: str
    created_at: datetime

    class Config:
        orm_mode = True

# ---------- Response schemas (inclusief relaties) ----------
class Catch(CatchBase):
    id: int
    participant_id: int

    class Config:
        orm_mode = True

class Participant(ParticipantBase):
    id: int
    competition_id: int
    catches: List[Catch] = []

    class Config:
        orm_mode = True

class Competition(CompetitionBase):
    id: int
    participants: List[Participant] = []

    class Config:
        orm_mode = True
