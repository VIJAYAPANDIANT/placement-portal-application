from datetime import datetime
from app import db


class Notification(db.Model):
    """
    Stores system-generated notifications for admins, students, and companies.
    Created automatically when key events occur.
    """
    __tablename__ = 'notifications'

    id         = db.Column(db.Integer, primary_key=True)
    title      = db.Column(db.String(200), nullable=False)
    message    = db.Column(db.Text, nullable=False)
    category   = db.Column(db.String(50), nullable=False, default='info')
    # Categories: 'company_register', 'company_approved', 'company_rejected',
    #             'drive_posted', 'drive_approved', 'drive_rejected',
    #             'student_placed', 'student_blacklisted', 'info'
    is_read    = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # New routing columns to target notifications to specific roles or users
    role       = db.Column(db.String(50), nullable=False, default='admin')  # 'admin', 'student', 'company'
    user_id    = db.Column(db.Integer, nullable=True)  # Specific user ID if targeted, otherwise global for that role

    def __init__(self, title, message, category='info', is_read=False, created_at=None, role='admin', user_id=None):
        self.title = title
        self.message = message
        self.category = category
        self.is_read = is_read
        self.created_at = created_at if created_at is not None else datetime.utcnow()
        self.role = role
        self.user_id = user_id

    def to_dict(self):
        delta = datetime.utcnow() - self.created_at
        if delta.total_seconds() < 60:
            time_str = 'Just now'
        elif delta.total_seconds() < 3600:
            time_str = f'{int(delta.total_seconds() // 60)} min ago'
        elif delta.total_seconds() < 86400:
            time_str = f'{int(delta.total_seconds() // 3600)} hours ago'
        elif delta.days == 1:
            time_str = 'Yesterday'
        else:
            time_str = f'{delta.days} days ago'

        return {
            'id':         self.id,
            'title':      self.title,
            'message':    self.message,
            'category':   self.category,
            'is_read':    self.is_read,
            'time':       time_str,
            'created_at': self.created_at.isoformat(),
            'role':       self.role,
            'user_id':    self.user_id,
        }


def create_notification(title: str, message: str, category: str = 'info', role: str = 'admin', user_id: int = None):
    """Helper to create and persist a Notification record."""
    notif = Notification(title=title, message=message, category=category, role=role, user_id=user_id)
    db.session.add(notif)
    # Intentionally no commit here — caller handles the transaction
    return notif
