from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models
import schemas
from database import SessionLocal, engine
from typing import List
import random

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Competitie API")

# CORS toestaan voor frontend (tijdens ontwikkeling)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # staat alle domeinen toe
    allow_credentials=True,
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

# ---------- Competities ----------
@app.get("/competitions", response_model=List[schemas.Competition])
def get_competitions(db: Session = Depends(get_db)):
    return db.query(models.Competition).all()

@app.get("/competitions/{comp_id}", response_model=schemas.Competition)
def get_competition(comp_id: int, db: Session = Depends(get_db)):
    comp = db.query(models.Competition).filter(models.Competition.id == comp_id).first()
    if not comp:
        raise HTTPException(404, "Competitie niet gevonden")
    return comp

@app.post("/competitions", response_model=schemas.Competition)
def create_competition(comp: schemas.CompetitionCreate, db: Session = Depends(get_db)):
    db_comp = models.Competition(**comp.dict())
    db.add(db_comp)
    db.commit()
    db.refresh(db_comp)
    return db_comp

@app.put("/competitions/{comp_id}", response_model=schemas.Competition)
def update_competition(comp_id: int, comp_update: schemas.CompetitionCreate, db: Session = Depends(get_db)):
    db_comp = db.query(models.Competition).filter(models.Competition.id == comp_id).first()
    if not db_comp:
        raise HTTPException(404, "Competitie niet gevonden")
    # Volledige vervanging (alle velden vereist)
    for key, value in comp_update.dict().items():
        setattr(db_comp, key, value)
    db.commit()
    db.refresh(db_comp)
    return db_comp

# ----- NIEUW PATCH ENDPOINT voor gedeeltelijke updates -----
@app.patch("/competitions/{comp_id}", response_model=schemas.Competition)
def patch_competition(comp_id: int, comp_update: schemas.CompetitionUpdate, db: Session = Depends(get_db)):
    db_comp = db.query(models.Competition).filter(models.Competition.id == comp_id).first()
    if not db_comp:
        raise HTTPException(404, "Competitie niet gevonden")
    # Alleen de meegegeven velden updaten
    update_data = comp_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_comp, key, value)
    db.commit()
    db.refresh(db_comp)
    return db_comp

@app.delete("/competitions/{comp_id}")
def delete_competition(comp_id: int, db: Session = Depends(get_db)):
    db_comp = db.query(models.Competition).filter(models.Competition.id == comp_id).first()
    if not db_comp:
        raise HTTPException(404, "Competitie niet gevonden")
    db.delete(db_comp)
    db.commit()
    return {"ok": True}

@app.patch("/competitions/{comp_id}/status")
def update_status(comp_id: int, status: str, db: Session = Depends(get_db)):
    db_comp = db.query(models.Competition).filter(models.Competition.id == comp_id).first()
    if not db_comp:
        raise HTTPException(404, "Competitie niet gevonden")
    db_comp.status = status
    db.commit()
    return {"status": status}

# ---------- Deelnemers ----------
@app.post("/competitions/{comp_id}/participants", response_model=schemas.Participant)
def add_participant(comp_id: int, participant: schemas.ParticipantCreate, db: Session = Depends(get_db)):
    comp = db.query(models.Competition).filter(models.Competition.id == comp_id).first()
    if not comp:
        raise HTTPException(404, "Competitie niet gevonden")
    db_part = models.Participant(**participant.dict(), competition_id=comp_id)
    db.add(db_part)
    db.commit()
    db.refresh(db_part)
    return db_part

@app.put("/participants/{part_id}")
def update_participant(part_id: int, participant: schemas.ParticipantCreate, db: Session = Depends(get_db)):
    db_part = db.query(models.Participant).filter(models.Participant.id == part_id).first()
    if not db_part:
        raise HTTPException(404, "Deelnemer niet gevonden")
    for key, value in participant.dict().items():
        setattr(db_part, key, value)
    db.commit()
    return db_part

@app.delete("/participants/{part_id}")
def delete_participant(part_id: int, db: Session = Depends(get_db)):
    db_part = db.query(models.Participant).filter(models.Participant.id == part_id).first()
    if not db_part:
        raise HTTPException(404, "Deelnemer niet gevonden")
    db.delete(db_part)
    db.commit()
    return {"ok": True}

@app.post("/competitions/{comp_id}/assign-numbers")
def assign_numbers_randomly(comp_id: int, db: Session = Depends(get_db)):
    comp = db.query(models.Competition).filter(models.Competition.id == comp_id).first()
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
def add_catch(part_id: int, catch: schemas.CatchCreate, db: Session = Depends(get_db)):
    part = db.query(models.Participant).filter(models.Participant.id == part_id).first()
    if not part:
        raise HTTPException(404, "Deelnemer niet gevonden")
    db_catch = models.Catch(**catch.dict(), participant_id=part_id)
    db.add(db_catch)
    db.commit()
    db.refresh(db_catch)
    return db_catch

@app.put("/catches/{catch_id}", response_model=schemas.Catch)
def update_catch(catch_id: int, catch: schemas.CatchCreate, db: Session = Depends(get_db)):
    db_catch = db.query(models.Catch).filter(models.Catch.id == catch_id).first()
    if not db_catch:
        raise HTTPException(404, "Vangst niet gevonden")
    for key, value in catch.dict().items():
        setattr(db_catch, key, value)
    db.commit()
    db.refresh(db_catch)
    return db_catch

@app.delete("/catches/{catch_id}")
def delete_catch(catch_id: int, db: Session = Depends(get_db)):
    db_catch = db.query(models.Catch).filter(models.Catch.id == catch_id).first()
    if not db_catch:
        raise HTTPException(404, "Vangst niet gevonden")
    db.delete(db_catch)
    db.commit()
    return {"ok": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)