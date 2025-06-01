from sqlalchemy import create_engine, Column, Integer, String, DateTime, JSON, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import datetime

Base = declarative_base()

class Memory(Base):
    __tablename__ = "memories"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    content = Column(Text, nullable=False)
    metadata = Column(JSON, nullable=True)

engine = create_engine(os.getenv("DATABASE_URL", "sqlite:///./memory.db"))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def store_memory(content, metadata=None):
    db = SessionLocal()
    memory = Memory(content=content, metadata=metadata)
    db.add(memory)
    db.commit()
    db.refresh(memory)
    db.close()
    return memory

def retrieve_memories(limit=10):
    db = SessionLocal()
    memories = db.query(Memory).order_by(Memory.timestamp.desc()).limit(limit).all()
    db.close()
    return memories 