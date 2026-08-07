from app import db
from datetime import datetime

class StudentOTP(db.Model):
    __tablename__ = 'student_otp'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('student.id', ondelete='CASCADE'), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    otp = db.Column(db.String(6), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    attempts = db.Column(db.Integer, default=0, nullable=False)
    verified = db.Column(db.Boolean, default=False, nullable=False)

    student = db.relationship('Student', backref=db.backref('otps', cascade='all, delete-orphan', lazy=True))

    def __init__(self, student_id, email, otp, expires_at, created_at=None, attempts=0, verified=False):
        self.student_id = student_id
        self.email = email
        self.otp = otp
        self.expires_at = expires_at
        if created_at:
            self.created_at = created_at
        self.attempts = attempts
        self.verified = verified

    def __repr__(self):
        return f'<StudentOTP for {self.email}>'
