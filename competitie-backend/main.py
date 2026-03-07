import geocoding
import weather
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from typing import List
import random
import models
import schemas
import auth
from database import SessionLocal, engine random

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Competitie API")

# CORS toestaan voor frontend (tijdens ontwikkeling)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://hengelsport-wedstrijdmanager.vercel.app",
        "https://hengelsport-wedstrijdma-git-9aa740-alessandrosimone10s-projects.vercel.app"
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency om DB-sessie te krijgen
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = schemas.TokenData(id=int(user_id))
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.id == token_data.id).first()
    if user is None:
        raise credentials_exception
    return user

# ---------- Authenticatie endpoints ----------
@app.post("/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
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
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    access_token = auth.create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

# ---------- Competities (beveiligd) ----------
@app.get("/competitions", response_model=List[schemas.Competition])
def get_competitions(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Competition).filter(models.Competition.owner_id == current_user.id).all()

@app.get("/competitions/{comp_id}", response_model=schemas.Competition)
def get_competition(comp_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    comp = db.query(models.Competition).filter(models.Competition.id == comp_id, models.Competition.owner_id == current_user.id).first()
    if not comp:
        raise HTTPException(404, "Competitie niet gevonden")
    return comp

@app.post("/competitions", response_model=schemas.Competition)
async def create_competition(comp: schemas.CompetitionCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Probeer coördinaten te vinden voor de locatie
    coordinates = await geocoding.get_coordinates_from_location(comp.location)
    
    if coordinates:
        lat, lon = coordinates
        db_comp = models.Competition(**comp.dict(), owner_id=current_user.id, latitude=lat, longitude=lon)
    else:
        db_comp = models.Competition(**comp.dict(), owner_id=current_user.id)
        print(f"⚠️ Geen coördinaten gevonden voor {comp.location}")
    
    db.add(db_comp)
    db.commit()
    db.refresh(db_comp)
    return db_comp
    
@app.put("/competitions/{comp_id}", response_model=schemas.Competition)
def update_competition(comp_id: int, comp_update: schemas.CompetitionCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_comp = db.query(models.Competition).filter(models.Competition.id == comp_id, models.Competition.owner_id == current_user.id).first()
    if not db_comp:
        raise HTTPException(404, "Competitie niet gevonden")
    for key, value in comp_update.dict().items():
        setattr(db_comp, key, value)
    db.commit()
    db.refresh(db_comp)
    return db_comp

@app.patch("/competitions/{comp_id}", response_model=schemas.Competition)
def patch_competition(comp_id: int, comp_update: schemas.CompetitionUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_comp = db.query(models.Competition).filter(models.Competition.id == comp_id, models.Competition.owner_id == current_user.id).first()
    if not db_comp:
        raise HTTPException(404, "Competitie niet gevonden")
    update_data = comp_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_comp, key, value)
    db.commit()
    db.refresh(db_comp)
    return db_comp

@app.delete("/competitions/{comp_id}")
def delete_competition(comp_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_comp = db.query(models.Competition).filter(models.Competition.id == comp_id, models.Competition.owner_id == current_user.id).first()
    if not db_comp:
        raise HTTPException(404, "Competitie niet gevonden")
    db.delete(db_comp)
    db.commit()
    return {"ok": True}

@app.patch("/competitions/{comp_id}/status")
def update_status(comp_id: int, status: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_comp = db.query(models.Competition).filter(models.Competition.id == comp_id, models.Competition.owner_id == current_user.id).first()
    if not db_comp:
        raise HTTPException(404, "Competitie niet gevonden")
    db_comp.status = status
    db.commit()
    return {"status": status}

# ---------- Deelnemers ----------
@app.post("/competitions/{comp_id}/participants", response_model=schemas.Participant)
def add_participant(comp_id: int, participant: schemas.ParticipantCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    comp = db.query(models.Competition).filter(models.Competition.id == comp_id, models.Competition.owner_id == current_user.id).first()
    if not comp:
        raise HTTPException(404, "Competitie niet gevonden")
    db_part = models.Participant(**participant.dict(), competition_id=comp_id, owner_id=current_user.id)
    db.add(db_part)
    db.commit()
    db.refresh(db_part)
    return db_part

@app.put("/participants/{part_id}")
def update_participant(part_id: int, participant: schemas.ParticipantCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_part = db.query(models.Participant).filter(models.Participant.id == part_id, models.Participant.owner_id == current_user.id).first()
    if not db_part:
        raise HTTPException(404, "Deelnemer niet gevonden")
    for key, value in participant.dict().items():
        setattr(db_part, key, value)
    db.commit()
    return db_part

@app.delete("/participants/{part_id}")
def delete_participant(part_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_part = db.query(models.Participant).filter(models.Participant.id == part_id, models.Participant.owner_id == current_user.id).first()
    if not db_part:
        raise HTTPException(404, "Deelnemer niet gevonden")
    db.delete(db_part)
    db.commit()
    return {"ok": True}

@app.post("/competitions/{comp_id}/assign-numbers")
def assign_numbers_randomly(comp_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    comp = db.query(models.Competition).filter(models.Competition.id == comp_id, models.Competition.owner_id == current_user.id).first()
    if not comp or not comp.available_numbers:
        raise HTTPException(400, "Geen beschikbare nummers")
    numbers = comp.available_numbers[:]
    random.shuffle(numbers)
    for i, part in enumerate(comp.participants):
        if i < len(numbers):
            part.number = numbers[i]
    db.commit()
    return {"ok": True}

# ---------- Vangsten ----------
@app.post("/participants/{part_id}/catches", response_model=schemas.Catch)
def add_catch(part_id: int, catch: schemas.CatchCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    part = db.query(models.Participant).filter(models.Participant.id == part_id, models.Participant.owner_id == current_user.id).first()
    if not part:
        raise HTTPException(404, "Deelnemer niet gevonden")
    db_catch = models.Catch(**catch.dict(), participant_id=part_id, owner_id=current_user.id)
    db.add(db_catch)
    db.commit()
    db.refresh(db_catch)
    return db_catch

@app.put("/catches/{catch_id}", response_model=schemas.Catch)
def update_catch(catch_id: int, catch: schemas.CatchCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_catch = db.query(models.Catch).filter(models.Catch.id == catch_id, models.Catch.owner_id == current_user.id).first()
    if not db_catch:
        raise HTTPException(404, "Vangst niet gevonden")
    for key, value in catch.dict().items():
        setattr(db_catch, key, value)
    db.commit()
    db.refresh(db_catch)
    return db_catch

@app.delete("/catches/{catch_id}")
def delete_catch(catch_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_catch = db.query(models.Catch).filter(models.Catch.id == catch_id, models.Catch.owner_id == current_user.id).first()
    if not db_catch:
        raise HTTPException(404, "Vangst niet gevonden")
    db.delete(db_catch)
    db.commit()
    return {"ok": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

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
    
    if not comp.latitude or not comp.longitude:
        # Probeer coördinaten alsnog te vinden
        coordinates = await geocoding.get_coordinates_from_location(comp.location)
        if coordinates:
            comp.latitude, comp.longitude = coordinates
            db.commit()
        else:
            raise HTTPException(400, f"Geen coördinaten gevonden voor locatie: {comp.location}")
    
    weather_data = await weather.get_weather_for_location(comp.latitude, comp.longitude)
    
    if not weather_data:
        raise HTTPException(503, "Weerdata niet beschikbaar op dit moment")
    
    return weather_data
