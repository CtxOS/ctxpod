from sqlalchemy import create_all, Column, String, Integer, Float, DateTime, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy import create_engine
import datetime
import os

# Use SQLite as default for portability, Switch to PostgreSQL in production via DATABASE_URL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./grid_compute.db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class JobRecord(Base):
    __tablename__ = "jobs"
    
    id = Column(String, primary_key=True, index=True)
    task_type = Column(String)
    status = Column(String)
    priority = Column(Integer)
    node_id = Column(String, nullable=True)
    cluster_type = Column(String)
    params = Column(JSON)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    cost = Column(Float, default=0.0)
    user_scope = Column(String)

class NodeRecord(Base):
    __tablename__ = "nodes"
    
    id = Column(String, primary_key=True, index=True)
    type = Column(String) # local | cloud
    status = Column(String)
    vram_gb = Column(Integer)
    cpu_cores = Column(Integer)
    first_seen = Column(DateTime, default=datetime.datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.datetime.utcnow)

class CostLog(Base):
    __tablename__ = "cost_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    amount = Column(Float)
    currency = Column(String, default="USD")
    node_id = Column(String)

class SystemDecision(Base):
    __tablename__ = "system_decisions"
    
    id = Column(String, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    component = Column(String) # Planner | Critic | Scheduler | Engine
    action = Column(String)
    rationale = Column(String)
    input_data = Column(JSON)
    output_data = Column(JSON)
    status = Column(String) # Authorized | Blocked | Warning

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
