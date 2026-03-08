from pydantic import BaseModel, EmailStr
from typing import List, Optional, Any

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

# ---------- Pending participants ----------
class PendingParticipantBase(BaseModel):
    name: str
    email: str

class PendingParticipantCreate(PendingParticipantBase):
    pass

class PendingParticipant(PendingParticipantBase):
    id: int
    competition_id: int
    status: str
    created_at: datetime

    class Config:
        orm_mode = True

@app.get("/admin/pending-participants", response_model=List[schemas.PendingParticipant])
def get_pending_participants(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Alleen admins mogen dit zien? Jij bent de enige gebruiker, dus geen extra check nodig.
    # Maar je kunt eventueel `is_admin` gebruiken.
    if not current_user.is_admin:
        raise HTTPException(403, "Niet toegestaan")
    return db.query(models.PendingParticipant).filter(models.PendingParticipant.status == "pending").all()

@app.post("/admin/pending-participants/{pending_id}/approve")
def approve_participant(
    pending_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(403, "Niet toegestaan")
    pending = db.query(models.PendingParticipant).filter(models.PendingParticipant.id == pending_id).first()
    if not pending:
        raise HTTPException(404, "Aanmelding niet gevonden")
    if pending.status != "pending":
        raise HTTPException(400, "Aanmelding is al behandeld")

    # Controleer of er nog plaats is
    comp = db.query(models.Competition).filter(models.Competition.id == pending.competition_id).first()
    if comp.max_participants and len(comp.participants) >= comp.max_participants:
        raise HTTPException(400, "Maximum aantal deelnemers bereikt")

    # Maak echte deelnemer aan
    new_participant = models.Participant(
        name=pending.name,
        competition_id=pending.competition_id,
        owner_id=current_user.id  # De eigenaar van de wedstrijd is de beheerder (jij)
    )
    db.add(new_participant)
    pending.status = "approved"
    db.commit()
    return {"message": "Goedgekeurd"}

@app.post("/admin/pending-participants/{pending_id}/reject")
def reject_participant(
    pending_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(403, "Niet toegestaan")
    pending = db.query(models.PendingParticipant).filter(models.PendingParticipant.id == pending_id).first()
    if not pending:
        raise HTTPException(404, "Aanmelding niet gevonden")
    if pending.status != "pending":
        raise HTTPException(400, "Aanmelding is al behandeld")
    pending.status = "rejected"
    db.commit()
    return {"message": "Afgewezen"}
