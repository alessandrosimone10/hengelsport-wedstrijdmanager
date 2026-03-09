import random
import time
import asyncio

import geocoding
import weather

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from typing import List

import models
import schemas
import auth
from database import SessionLocal, engine
from email import send_approval_email, send_rejection_email
from email import send_approval_email, send_rejection_email

# Fix async issues on some hosting platforms
asyncio.set_event_loop_policy(asyncio.DefaultEventLoopPolicy())

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Competitie API")

# ---------- CORS ----------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],           # Voor productie vervangen door specifieke domeinen
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- DATABASE ----------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---------- AUTH ----------
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Niet geautoriseerd",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = schemas.TokenData(id=int(user_id))
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.id == token_data.id).first()
    if not user:
        raise credentials_exception
    return user

# ---------- WEER CACHE ----------
weather_cache = {}
CACHE_DURATION = 600  # 10 minuten

# ---------- AUTHENTICATIE ENDPOINTS ----------
@app.post("/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(400, "Email al geregistreerd")
    hashed = auth.get_password_hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(400, "Incorrect email of wachtwoord")
    token = auth.create_access_token(data={"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.User)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

# ---------- TEST ENDPOINTS (optioneel) ----------
@app.get("/test/{id}")
async def test_route(id: int):
    return {"id": id, "message": "test werkt"}

@app.get("/test2/{id}")
def test2(id: int):
    return {"id": id, "message": "test2 werkt"}

@app.get("/auth-test")
def auth_test(current_user: models.User = Depends(get_current_user)):
    return {"email": current_user.email}

# ---------- COMPETITIE ENDPOINTS ----------
@app.patch("/competitions/{comp_id}/status", response_model=schemas.Competition)
def update_competition_status(
        comp_id: int,
        data: schemas.CompetitionStatusUpdate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    comp = db.query(models.Competition).filter(
        models.Competition.id == comp_id,
        models.Competition.owner_id == current_user.id
    ).first()
    if not comp:
        raise HTTPException(404, "Competitie niet gevonden")
    comp.status = data.status
    db.commit()
    db.refresh(comp)
    return comp

@app.get("/competitions", response_model=List[schemas.Competition])
def get_competitions(
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    return db.query(models.Competition).filter(
        models.Competition.owner_id == current_user.id
    ).all()

@app.get("/competitions/{comp_id}", response_model=schemas.Competition)
def get_competition(
        comp_id: int,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    comp = db.query(models.Competition).filter(
        models.Competition.id == comp_id,
        models.Competition.owner_id == current_user.id
    ).first()
    if not comp:
        raise HTTPException(404, "Competitie niet gevonden")
    return comp
@app.patch("/competitions/{comp_id}", response_model=schemas.Competition)
def patch_competition(
        comp_id: int,
        comp_update: schemas.CompetitionUpdate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    db_comp = db.query(models.Competition).filter(
        models.Competition.id == comp_id,
        models.Competition.owner_id == current_user.id
    ).first()
    if not db_comp:
        raise HTTPException(404, "Competitie niet gevonden")
    
    update_data = comp_update.dict(exclude_unset=True)
    
    # Converteer prize_percentages als het een string is
    if 'prize_percentages' in update_data and isinstance(update_data['prize_percentages'], str):
        import json
        try:
            update_data['prize_percentages'] = json.loads(update_data['prize_percentages'])
        except json.JSONDecodeError:
            raise HTTPException(400, "Ongeldig formaat voor prize_percentages")
    
    for key, value in update_data.items():
        setattr(db_comp, key, value)
    
    db.commit()
    db.refresh(db_comp)
    return db_comp

@app.post("/competitions", response_model=schemas.Competition)
async def create_competition(
        comp: schemas.CompetitionCreate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    coordinates = await geocoding.get_coordinates_from_location(comp.location)
    latitude = None
    longitude = None
    if coordinates:
        latitude, longitude = coordinates
    db_comp = models.Competition(
        **comp.dict(),
        owner_id=current_user.id,
        latitude=latitude,
        longitude=longitude
    )
    db.add(db_comp)
    db.commit()
    db.refresh(db_comp)
    return db_comp

@app.delete("/competitions/{comp_id}")
def delete_competition(
        comp_id: int,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    comp = db.query(models.Competition).filter(
        models.Competition.id == comp_id,
        models.Competition.owner_id == current_user.id
    ).first()
    if not comp:
        raise HTTPException(404, "Competitie niet gevonden")
    db.delete(comp)
    db.commit()
    return {"ok": True}

# ---------- DEELNEMERS ----------
@app.post("/competitions/{comp_id}/participants", response_model=schemas.Participant)
def add_participant(
        comp_id: int,
        participant: schemas.ParticipantCreate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    comp = db.query(models.Competition).filter(
        models.Competition.id == comp_id,
        models.Competition.owner_id == current_user.id
    ).first()
    if not comp:
        raise HTTPException(404, "Competitie niet gevonden")
    if comp.max_participants and len(comp.participants) >= comp.max_participants:
        raise HTTPException(400, "Maximum deelnemers bereikt")
    db_part = models.Participant(
        **participant.dict(),
        competition_id=comp_id,
        owner_id=current_user.id
    )
    db.add(db_part)
    db.commit()
    db.refresh(db_part)
    return db_part

@app.delete("/participants/{part_id}")
def delete_participant(
        part_id: int,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    part = db.query(models.Participant).filter(
        models.Participant.id == part_id,
        models.Participant.owner_id == current_user.id
    ).first()
    if not part:
        raise HTTPException(404, "Deelnemer niet gevonden")
    db.delete(part)
    db.commit()
    return {"ok": True}
# ---------- PUBLIEKE INSCHRIJVING ----------
@app.post("/public/competitions/{comp_id}/register")
def public_register(
    comp_id: int,
    participant: schemas.PendingParticipantBase,
    db: Session = Depends(get_db)
):
    comp = db.query(models.Competition).filter(models.Competition.id == comp_id).first()
    if not comp:
        raise HTTPException(404, "Competitie niet gevonden")
    # Optioneel: controleer maximum aantal deelnemers
    if comp.max_participants and len(comp.participants) >= comp.max_participants:
        raise HTTPException(400, "Maximum aantal deelnemers bereikt")
    pending = models.PendingParticipant(
        name=participant.name,
        email=participant.email,
        competition_id=comp_id,
        status="pending"
    )
    db.add(pending)
    db.commit()
    db.refresh(pending)
    return {"message": "Aanmelding ontvangen, wacht op goedkeuring", "id": pending.id}

@app.get("/public/competitions")
def get_public_competitions(db: Session = Depends(get_db)):
    competitions = db.query(models.Competition).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "date": c.date,
            "location": c.location,
            "status": c.status,
            "max_participants": c.max_participants,
            "current_participants": len(c.participants)
        }
        for c in competitions
    ]

@app.get("/public/my-applications")
def get_my_applications(email: str, db: Session = Depends(get_db)):
    if not email:
        raise HTTPException(400, "E-mailadres is verplicht")
    applications = db.query(models.PendingParticipant).filter(
        models.PendingParticipant.email == email
    ).all()
    result = []
    for app in applications:
        comp = db.query(models.Competition).filter(models.Competition.id == app.competition_id).first()
        result.append({
            "id": app.id,
            "competition_name": comp.name if comp else "Onbekend",
            "competition_date": comp.date if comp else None,
            "status": app.status,
            "created_at": app.created_at.isoformat() if app.created_at else None
        })
    return result
# ---------- ADMIN: OPENSTAANDE AANMELDINGEN ----------
@app.get("/admin/pending-participants", response_model=List[schemas.PendingParticipant])
def get_pending_participants(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Alleen ingelogde gebruikers (jij) mogen dit zien. Optioneel: check op is_admin
    return db.query(models.PendingParticipant).filter(models.PendingParticipant.status == "pending").all()

@app.post("/admin/pending-participants/{pending_id}/approve")
def approve_pending(
    pending_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
     # Verstuur e‑mail
    send_approval_email(pending.email, comp.name)
    return {"message": "Goedgekeurd"}
):

    pending = db.query(models.PendingParticipant).filter(models.PendingParticipant.id == pending_id).first()
    if not pending:
        raise HTTPException(404, "Aanmelding niet gevonden")
    if pending.status != "pending":
        raise HTTPException(400, "Aanmelding is al behandeld")

    # Controleer of de wedstrijd nog plaats heeft
    comp = db.query(models.Competition).filter(models.Competition.id == pending.competition_id).first()
    if comp.max_participants and len(comp.participants) >= comp.max_participants:
        raise HTTPException(400, "Maximum aantal deelnemers bereikt")

    # Maak echte deelnemer aan
    new_participant = models.Participant(
        name=pending.name,
        competition_id=pending.competition_id,
        owner_id=current_user.id  # of comp.owner_id? Jij bent de eigenaar.
    )
    db.add(new_participant)
    pending.status = "approved"
    db.commit()
    return {"message": "Goedgekeurd"}

@app.post("/admin/pending-participants/{pending_id}/reject")
def reject_pending(
    pending_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
        send_rejection_email(pending.email, comp.name)
    return {"message": "Afgewezen"}
):
    pending = db.query(models.PendingParticipant).filter(models.PendingParticipant.id == pending_id).first()
    if not pending:
        raise HTTPException(404, "Aanmelding niet gevonden")
    if pending.status != "pending":
        raise HTTPException(400, "Aanmelding is al behandeld")
    pending.status = "rejected"
    db.commit()
    return {"message": "Afgewezen"}

# ---------- VANGSTEN ----------
@app.post("/participants/{part_id}/catches", response_model=schemas.Catch)
def add_catch(
        part_id: int,
        catch: schemas.CatchCreate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    part = db.query(models.Participant).filter(
        models.Participant.id == part_id,
        models.Participant.owner_id == current_user.id
    ).first()
    if not part:
        raise HTTPException(404, "Deelnemer niet gevonden")
    db_catch = models.Catch(
        **catch.dict(),
        participant_id=part_id,
        owner_id=current_user.id
    )
    db.add(db_catch)
    db.commit()
    db.refresh(db_catch)
    return db_catch

# ---------- NUMMERS LOTTEN ----------
@app.post("/competitions/{comp_id}/assign-numbers")
def assign_numbers(
        comp_id: int,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    comp = db.query(models.Competition).filter(
        models.Competition.id == comp_id,
        models.Competition.owner_id == current_user.id
    ).first()
    if not comp or not comp.available_numbers:
        raise HTTPException(400, "Geen beschikbare nummers")
    numbers = comp.available_numbers[:]
    random.shuffle(numbers)
    for i, part in enumerate(comp.participants):
        if i < len(numbers):
            part.number = numbers[i]
    db.commit()
    return {"ok": True}

# ---------- WEER ----------
@app.get("/competitions/{comp_id}/weather")
async def get_competition_weather(
        comp_id: int,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    comp = db.query(models.Competition).filter(
        models.Competition.id == comp_id,
        models.Competition.owner_id == current_user.id
    ).first()
    if not comp:
        raise HTTPException(404, "Competitie niet gevonden")
    if comp.latitude is None or comp.longitude is None:
        coordinates = await geocoding.get_coordinates_from_location(comp.location)
        if not coordinates:
            raise HTTPException(400, f"Geen coördinaten gevonden voor {comp.location}")
        comp.latitude, comp.longitude = coordinates
        db.commit()
    cache_key = f"{comp.latitude}_{comp.longitude}"
    if cache_key in weather_cache:
        cached = weather_cache[cache_key]
        if time.time() - cached["timestamp"] < CACHE_DURATION:
            return cached["data"]
    weather_data = await weather.get_weather_for_location(comp.latitude, comp.longitude)
    if not weather_data:
        raise HTTPException(503, "Weerdata niet beschikbaar")
    weather_cache[cache_key] = {"data": weather_data, "timestamp": time.time()}
    return weather_data

# ---------- RANKING ----------
@app.get("/competitions/{comp_id}/ranking")
def get_ranking(
        comp_id: int,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    comp = db.query(models.Competition).filter(
        models.Competition.id == comp_id,
        models.Competition.owner_id == current_user.id
    ).first()
    if not comp:
        raise HTTPException(404, "Competitie niet gevonden")
    ranking = []
    for participant in comp.participants:
        total_weight = sum(c.weight for c in participant.catches)
        fish_count = len(participant.catches)
        ranking.append({
            "participant_id": participant.id,
            "name": participant.name,
            "number": participant.number,
            "fish_count": fish_count,
            "total_weight": total_weight
        })
    ranking.sort(key=lambda x: x["total_weight"], reverse=True)
    return ranking

# ---------- DASHBOARD ----------
@app.get("/competitions/{comp_id}/dashboard")
def get_dashboard(
        comp_id: int,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    comp = db.query(models.Competition).filter(
        models.Competition.id == comp_id,
        models.Competition.owner_id == current_user.id
    ).first()
    if not comp:
        raise HTTPException(404, "Competitie niet gevonden")
    total_fish = 0
    total_weight = 0
    for p in comp.participants:
        for c in p.catches:
            total_fish += 1
            total_weight += c.weight
    return {
        "competition": comp.name,
        "participants": len(comp.participants),
        "total_fish": total_fish,
        "total_weight": total_weight
    }
