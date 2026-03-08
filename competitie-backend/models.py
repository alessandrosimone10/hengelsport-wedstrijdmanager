from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean, JSON, DateTime
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)

    competitions = relationship("Competition", back_populates="owner")
    participants = relationship("Participant", back_populates="owner")
    catches = relationship("Catch", back_populates="owner")

class Competition(Base):
    __tablename__ = "competitions"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    date = Column(String, nullable=False)
    location = Column(String, nullable=False)
    status = Column(String, default="upcoming")
    entry_fee = Column(Float, nullable=True)
    available_numbers = Column(JSON, nullable=True)
    prize_distribution = Column(Integer, nullable=True)
    prize_percentages = Column(JSON, nullable=True)
    fish_fund_percentage = Column(Float, nullable=True)
    custom_prize_pot = Column(Float, nullable=True)
    max_participants = Column(Integer, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="competitions")
    participants = relationship("Participant", back_populates="competition", cascade="all, delete-orphan")

class Participant(Base):
    __tablename__ = "participants"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    number = Column(Integer, nullable=True)

    competition_id = Column(Integer, ForeignKey("competitions.id"))
    competition = relationship("Competition", back_populates="participants")

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="participants")

    catches = relationship("Catch", back_populates="participant", cascade="all, delete-orphan")

class Catch(Base):
    __tablename__ = "catches"
    id = Column(Integer, primary_key=True, index=True)
    species = Column(String, nullable=False)
    weight = Column(Integer, nullable=False)
    time = Column(String, nullable=True)

    participant_id = Column(Integer, ForeignKey("participants.id"))
    participant = relationship("Participant", back_populates="catches")

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="catches")

class PendingParticipant(Base):
    __tablename__ = "pending_participants"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    competition_id = Column(Integer, ForeignKey("competitions.id"))
    status = Column(String, default="pending")  # pending, approved, rejected
    created_at = Column(DateTime, default=datetime.utcnow)

    competition = relationship("Competition")
