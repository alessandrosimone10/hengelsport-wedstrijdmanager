from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Table, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Competition(Base):
    __tablename__ = "competitions"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    date = Column(String, nullable=False)          # YYYY-MM-DD
    location = Column(String, nullable=False)
    status = Column(String, default="upcoming")    # upcoming, active, completed
    entry_fee = Column(Float, nullable=True)
    available_numbers = Column(JSON, nullable=True)  # lijst van getallen
    prize_distribution = Column(JSON, nullable=True)
    prize_percentages = Column(JSON, nullable=True)
    fish_fund_percentage = Column(Float, nullable=True)
    custom_prize_pot = Column(Float, nullable=True)

    participants = relationship("Participant", back_populates="competition", cascade="all, delete-orphan")

class Participant(Base):
    __tablename__ = "participants"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    number = Column(Integer, nullable=True)
    competition_id = Column(Integer, ForeignKey("competitions.id"))
    competition = relationship("Competition", back_populates="participants")
    catches = relationship("Catch", back_populates="participant", cascade="all, delete-orphan")

class Catch(Base):
    __tablename__ = "catches"
    id = Column(Integer, primary_key=True, index=True)
    species = Column(String, nullable=False)
    weight = Column(Integer, nullable=False)        # in gram
    time = Column(String, nullable=True)            # tijdstip "HH:MM"
    participant_id = Column(Integer, ForeignKey("participants.id"))
    participant = relationship("Participant", back_populates="catches")