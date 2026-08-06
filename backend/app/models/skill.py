from datetime import datetime
from app import db

class Skill(db.Model):
    __tablename__ = 'skill'

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('student.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(100), nullable=False) # e.g. Programming Languages, Frameworks, etc.
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def __init__(self, student_id, name, category):
        self.student_id = student_id
        self.name = name
        self.category = category

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
