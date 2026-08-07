from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt, get_jwt_identity
from app import db, cache, mail
from app.models.admin import Admin
from app.models.company import Company
from app.models.student import Student
from app.models.student_otp import StudentOTP
from app.models.notification import Notification, create_notification
from datetime import datetime, timedelta
import secrets
from flask_mail import Message

# Create the authentication Blueprint. URL prefixes will be configured in create_app().
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    POST /login
    Accepts JSON body: {email, password}
    Checks tables in order: Admin -> Company -> Student.
    Validates password using werkzeug security check.
    For Admin and Company, returns a JWT access token immediately.
    For Student, generates a secure random 6-digit OTP, sends it via email, and redirects to validation.
    """
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')
    
    # 1. Validation check for missing fields
    if not email or not password:
        return jsonify({'message': 'Email and password are required'}), 400
        
    role = None
    user = None
    
    # 2. Check Admin table first
    admin_user = Admin.query.filter_by(email=email).first()
    if admin_user and check_password_hash(admin_user.password_hash, password):
        user = admin_user
        role = 'admin'
        
    # 3. Check Company table second if not found in Admin
    if not role:
        company_user = Company.query.filter_by(email=email).first()
        if company_user and check_password_hash(company_user.password_hash, password):
            # If the company registration is not approved by Admin, reject access with a 403 Forbidden
            if company_user.approval_status != 'approved':
                return jsonify({'message': 'Account pending approval'}), 403
            user = company_user
            role = 'company'
            
    # 4. Check Student table third if not found in Admin or Company
    if not role:
        student_user = Student.query.filter_by(email=email).first()
        if student_user:
            # Check lockout status first
            if student_user.locked_until and student_user.locked_until > datetime.utcnow():
                return jsonify({'message': 'Your account has been temporarily locked due to multiple failed login attempts.'}), 423
                
            # Validate password
            if check_password_hash(student_user.password_hash, password):
                # Ensure the student is active (not deactivated or suspended)
                if not student_user.is_active:
                    return jsonify({'message': 'Account is inactive'}), 403
                
                # Delete any old OTPs for this student to keep db clean
                StudentOTP.query.filter_by(email=email).delete()
                
                # Generate cryptographically secure random 6-digit OTP
                otp_code = f"{secrets.randbelow(1000000):06d}"
                expires_at = datetime.utcnow() + timedelta(minutes=5)
                
                otp_record = StudentOTP(
                    student_id=student_user.id,
                    email=email,
                    otp=otp_code,
                    expires_at=expires_at
                )
                db.session.add(otp_record)
                
                # Send email verification code
                msg = Message(
                    subject="PlaceLink Login Verification",
                    recipients=[email],
                    body=f"Hello {student_user.name},\n\nYour login verification code is:\n\n{otp_code}\n\nThis OTP is valid for 5 minutes.\n\nDo not share this OTP with anyone.\n\nRegards,\nPlaceLink Placement Portal"
                )
                try:
                    mail.send(msg)
                except Exception as e:
                    db.session.rollback()
                    print("SMTP error:", e)
                    return jsonify({'message': f'Failed to send OTP email: {str(e)}'}), 500
                
                try:
                    student_user.last_active_at = datetime.utcnow()
                    db.session.commit()
                except Exception as e:
                    db.session.rollback()
                    print("Database commit failed during OTP generation:", e)
                    return jsonify({'message': 'Database error occurred'}), 500
                    
                return jsonify({"message": "OTP sent successfully"}), 200
            else:
                # Password check failed
                student_user.failed_login_attempts += 1
                if student_user.failed_login_attempts >= 5:
                    student_user.locked_until = datetime.utcnow() + timedelta(minutes=15)
                    db.session.commit()
                    return jsonify({'message': 'Your account has been temporarily locked due to multiple failed login attempts.'}), 423
                else:
                    db.session.commit()
                    return jsonify({'message': 'Invalid credentials'}), 401
            
    # 5. If credentials did not match any active user type, return 401 Unauthorized
    if not role or not user:
        return jsonify({'message': 'Invalid credentials'}), 401
        
    # Update last active timestamp
    try:
        if role == 'company':
            user.last_active_at = datetime.utcnow()
            db.session.commit()
    except Exception as e:
        print("Failed to update last_active_at during login:", e)
        
    # 6. Generate JWT access token with user details (id, role, email) embedded in the payload claims
    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={
            'id': user.id,
            'role': role,
            'email': user.email
        }
    )
    
    return jsonify(access_token=access_token), 200


@auth_bp.route('/register/student', methods=['POST'])
def register_student():
    """
    POST /register/student
    Accepts JSON body: {name, email, password, roll_number, branch, cgpa, graduation_year}
    Checks if email already exists, hashes password, creates and saves Student record.
    Returns 201 Created.
    """
    data = request.get_json() or {}
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    roll_number = data.get('roll_number')
    branch = data.get('branch')
    cgpa = data.get('cgpa')
    graduation_year = data.get('graduation_year')
    
    # 1. Validation check for missing fields
    if not all([name, email, password, roll_number, branch, cgpa is not None, graduation_year is not None]):
        return jsonify({'message': 'All student fields are required'}), 400
        
    # 2. Check if the email already exists in any user table to maintain unique login identities
    if (Student.query.filter_by(email=email).first() or 
        Company.query.filter_by(email=email).first() or 
        Admin.query.filter_by(email=email).first()):
        return jsonify({'message': 'Email already exists'}), 400
        
    # 3. Check if the roll number already exists
    if Student.query.filter_by(roll_number=roll_number).first():
        return jsonify({'message': 'Roll number already exists'}), 400
        
    # 4. Hash the password for security using werkzeug's PBKDF2 algorithm
    hashed_password = generate_password_hash(password)
    
    try:
        # 5. Create new Student record
        new_student = Student(
            name=name,
            email=email,
            password_hash=hashed_password,
            roll_number=roll_number,
            branch=branch,
            cgpa=float(cgpa),
            graduation_year=int(graduation_year),
            is_active=True,
            is_blacklisted=False
        )
        db.session.add(new_student)
        db.session.commit()
        try:
            cache.delete('admin_stats')
        except Exception:
            pass
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to create student: {str(e)}'}), 500
        
    return jsonify({'message': 'Student registered successfully'}), 201

@auth_bp.route('/register/company', methods=['POST'])
def register_company():
    """
    POST /register/company
    Accepts JSON body: {name, email, password, hr_contact, website, industry, description}
    Checks if email already exists, hashes password, creates Company record with approval_status='pending'.
    Returns 201 Created.
    """
    data = request.get_json() or {}
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    hr_contact = data.get('hr_contact')
    website = data.get('website')
    industry = data.get('industry')
    description = data.get('description')
    
    # 1. Validation check for missing fields
    if not name or not email or not password:
        return jsonify({'message': 'Name, email, and password are required'}), 400
        
    # 2. Check if the email already exists in any user table
    if (Student.query.filter_by(email=email).first() or 
        Company.query.filter_by(email=email).first() or 
        Admin.query.filter_by(email=email).first()):
        return jsonify({'message': 'Email already exists'}), 400
        
    # 3. Hash the password
    hashed_password = generate_password_hash(password)
    
    try:
        # 4. Create new Company record. Approval status defaults to 'pending' as required.
        new_company = Company(
            name=name,
            email=email,
            password_hash=hashed_password,
            hr_contact=hr_contact,
            website=website,
            industry=industry,
            description=description,
            approval_status='pending',
            is_active=True
        )
        db.session.add(new_company)

        # Notify admin that a new company is awaiting approval
        create_notification(
            title='New Company Registration',
            message=f'{name} ({industry}) has registered and is awaiting your approval.',
            category='company_register'
        )

        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Database error: {str(e)}'}), 500

    return jsonify({'message': 'Company registered successfully. Account pending Admin approval'}), 201



@auth_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_user_notifications():
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    unread_only = request.args.get('unread_only', 'false').lower() == 'true'
    query = Notification.query

    # Role-based notification routing
    if role == 'admin':
        # Admin gets all admin-bound notifications
        query = query.filter_by(role='admin')
    else:
        # Students/Companies get notifications targeting their role and specifically their user_id,
        # or general notifications for their role (user_id IS NULL)
        from sqlalchemy import or_
        query = query.filter_by(role=role).filter(or_(Notification.user_id == None, Notification.user_id == user_id))

    if unread_only:
        query = query.filter_by(is_read=False)

    notifications = query.order_by(Notification.created_at.desc()).limit(50).all()
    return jsonify([n.to_dict() for n in notifications]), 200


@auth_bp.route('/notifications/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    query = Notification.query.filter_by(is_read=False)

    if role == 'admin':
        query = query.filter_by(role='admin')
    else:
        from sqlalchemy import or_
        query = query.filter_by(role=role).filter(or_(Notification.user_id == None, Notification.user_id == user_id))

    count = query.count()
    return jsonify({'count': count}), 200


@auth_bp.route('/notifications/<int:notif_id>/read', methods=['PUT'])
@jwt_required()
def mark_notification_read(notif_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    notif = db.session.get(Notification, notif_id)
    if not notif:
        return jsonify({'message': 'Notification not found'}), 404

    # Security check: Ensure user owns this notification
    if notif.role != role:
        return jsonify({'message': 'Unauthorized'}), 403
    if notif.user_id is not None and notif.user_id != user_id:
        return jsonify({'message': 'Unauthorized'}), 403

    notif.is_read = True
    db.session.commit()
    return jsonify({'message': 'Marked as read'}), 200


@auth_bp.route('/notifications/mark-all-read', methods=['PUT'])
@jwt_required()
def mark_all_notifications_read():
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    query = Notification.query.filter_by(is_read=False, role=role)
    if role != 'admin':
        query = query.filter_by(user_id=user_id)

    query.update({'is_read': True}, synchronize_session=False)
    db.session.commit()
    return jsonify({'message': 'All notifications marked as read'}), 200


@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    """
    POST /verify-otp
    Accepts JSON body: {email, otp}
    Verifies code validity, attempts limit (max 3), expiration.
    Generates standard JWT on success, resets student login attempts/lockout, and deletes OTP.
    """
    data = request.get_json() or {}
    email = data.get('email')
    otp = data.get('otp')

    if not email or not otp:
        return jsonify({'message': 'Email and OTP are required'}), 400

    student = Student.query.filter_by(email=email).first()
    if not student:
        return jsonify({'message': 'Student not found'}), 404

    # Lock check
    if student.locked_until and student.locked_until > datetime.utcnow():
        return jsonify({'message': 'Your account has been temporarily locked due to multiple failed login attempts.'}), 423

    otp_record = StudentOTP.query.filter_by(email=email).first()
    if not otp_record:
        return jsonify({'message': 'OTP has expired. Please request a new OTP.'}), 400

    # Expiration check (5 minutes validity)
    if otp_record.expires_at < datetime.utcnow():
        db.session.delete(otp_record)
        db.session.commit()
        return jsonify({'message': 'OTP has expired. Please request a new OTP.'}), 400

    # Max attempts check (3 incorrect attempts)
    if otp_record.attempts >= 3:
        db.session.delete(otp_record)
        db.session.commit()
        return jsonify({'message': 'Maximum OTP attempts exceeded. Please request a new OTP.'}), 400

    # Check OTP code match
    if otp_record.otp == otp:
        # Success!
        # Reset password login tracking fields
        student.failed_login_attempts = 0
        student.locked_until = None
        
        # Delete OTP record
        db.session.delete(otp_record)
        
        # Set last active
        student.last_active_at = datetime.utcnow()
        db.session.commit()

        # Generate JWT access token exactly like the original login flow
        access_token = create_access_token(
            identity=str(student.id),
            additional_claims={
                'id': student.id,
                'role': 'student',
                'email': student.email
            }
        )

        # Build student user profile info payload just like standard login would
        user_info = {
            'id': student.id,
            'name': student.name,
            'email': student.email,
            'roll_number': student.roll_number,
            'branch': student.branch,
            'cgpa': student.cgpa,
            'graduation_year': student.graduation_year,
            'resume_url': student.resume_url,
            'is_active': student.is_active,
            'is_blacklisted': student.is_blacklisted
        }

        return jsonify(access_token=access_token, role='student', user=user_info), 200
    else:
        # Code mismatch
        otp_record.attempts += 1
        db.session.commit()

        if otp_record.attempts >= 3:
            db.session.delete(otp_record)
            db.session.commit()
            return jsonify({'message': 'Maximum OTP attempts exceeded. Please request a new OTP.'}), 400
        else:
            remaining = 3 - otp_record.attempts
            return jsonify({'message': f'Invalid OTP. You have {remaining} attempts remaining.'}), 400


@auth_bp.route('/resend-otp', methods=['POST'])
def resend_otp():
    """
    POST /resend-otp
    Accepts JSON body: {email}
    Generates a new secure random 6-digit OTP code, invalidating previous entries.
    """
    data = request.get_json() or {}
    email = data.get('email')

    if not email:
        return jsonify({'message': 'Email is required'}), 400

    student = Student.query.filter_by(email=email).first()
    if not student:
        return jsonify({'message': 'Student not found'}), 404

    # Lock check
    if student.locked_until and student.locked_until > datetime.utcnow():
        return jsonify({'message': 'Your account has been temporarily locked due to multiple failed login attempts.'}), 423

    # Delete any existing OTP entries for this student
    StudentOTP.query.filter_by(email=email).delete()

    # Generate a fresh OTP
    otp_code = f"{secrets.randbelow(1000000):06d}"
    expires_at = datetime.utcnow() + timedelta(minutes=5)

    otp_record = StudentOTP(
        student_id=student.id,
        email=email,
        otp=otp_code,
        expires_at=expires_at
    )
    db.session.add(otp_record)

    # Send the email
    msg = Message(
        subject="PlaceLink Login Verification",
        recipients=[email],
        body=f"Hello {student.name},\n\nYour login verification code is:\n\n{otp_code}\n\nThis OTP is valid for 5 minutes.\n\nDo not share this OTP with anyone.\n\nRegards,\nPlaceLink Placement Portal"
    )
    try:
        mail.send(msg)
    except Exception as e:
        db.session.rollback()
        print("SMTP resend error:", e)
        return jsonify({'message': f'Failed to send OTP email: {str(e)}'}), 500

    db.session.commit()
    return jsonify({"message": "OTP sent successfully"}), 200

