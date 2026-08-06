from app import db

class Company(db.Model):
    # Specifies the database table name explicitly.
    __tablename__ = 'company'
    
    # Primary Key - uniquely identifies each Company record.
    id = db.Column(db.Integer, primary_key=True)
    
    # Name of the company. It cannot be empty.
    name = db.Column(db.String(100), nullable=False)
    
    # The email address of the company (used for login). Must be unique and cannot be empty.
    email = db.Column(db.String(120), unique=True, nullable=False)
    
    # Hashed version of the company's password for security.
    password_hash = db.Column(db.String(255), nullable=False)
    
    # Contact information for the HR manager or representative.
    hr_contact = db.Column(db.String(50))
    
    # Official website URL of the company.
    website = db.Column(db.String(120))
    
    # Industry sector to which the company belongs (e.g. IT, Finance).
    industry = db.Column(db.String(100))
    
    # Brief description of the company.
    description = db.Column(db.Text)
    
    # Approval status of the company's self-registration. Defaults to 'pending'.
    approval_status = db.Column(db.String(20), default='pending', nullable=False)
    
    # Flag indicating if the company's account is currently active. Defaults to True.
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    
    # Timestamp of the company's last active request or login.
    last_active_at = db.Column(db.DateTime, nullable=True)
    
    # Establishes a one-to-many relationship with PlacementDrive.
    # - backref='company' allows a PlacementDrive instance to reference its Company as drive.company.
    # - lazy=True means related drives are loaded from the database only when accessed.
    drives = db.relationship('PlacementDrive', backref='company', lazy=True)

    def __init__(self, name, email, password_hash, hr_contact=None, website=None, industry=None, description=None, approval_status='pending', is_active=True, last_active_at=None):
        self.name = name
        self.email = email
        self.password_hash = password_hash
        self.hr_contact = hr_contact
        self.website = website
        self.industry = industry
        self.description = description
        self.approval_status = approval_status
        self.is_active = is_active
        self.last_active_at = last_active_at

    def __repr__(self):
        return f'<Company {self.name}>'
