from pydantic import BaseModel
from typing import List, Optional, Any

# ---------- Basis schema's ----------
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

    class Config:
        orm_mode = True

# ---------- Create schema's (gebruiken zelfde velden, geen extra) ----------
class CompetitionCreate(CompetitionBase):
    pass

class ParticipantCreate(ParticipantBase):
    pass

class CatchCreate(CatchBase):
    pass

# ---------- Response schema's (inclusief relaties) ----------
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