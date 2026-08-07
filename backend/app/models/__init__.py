# Imports all six database models so that SQLAlchemy knows about them
# when creating the tables with db.create_all()

from app.models.admin import Admin
from app.models.company import Company
from app.models.student import Student
from app.models.drive import PlacementDrive
from app.models.application import Application
from app.models.interview import InterviewSchedule
from app.models.notification import Notification, create_notification
from app.models.resume_analysis import ResumeAnalysis
from app.models.skill import Skill
from app.models.student_otp import StudentOTP
