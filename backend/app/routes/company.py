import os
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import get_jwt_identity
from datetime import datetime
from app import db
from app.models.company import Company
from app.models.drive import PlacementDrive
from app.models.application import Application
from app.models.student import Student
from app.models.interview import InterviewSchedule
from app.utils.decorators import role_required
from app.models.notification import create_notification

company_bp = Blueprint('company_bp', __name__)

def verify_approved_company():
    company = Company.query.get(int(get_jwt_identity()))
    if not company:
        return jsonify({"error": "Company not found"}), 404
    if company.approval_status != 'approved':
        return jsonify({"error": "Account not yet approved by Admin"}), 403
    return None

@company_bp.route('/drives', methods=['POST'])
@role_required('company')
def create_drive():
    approval_check = verify_approved_company()
    if approval_check:
        return approval_check

    data = request.get_json() or {}
    job_title = data.get('job_title')
    job_description = data.get('job_description')
    eligibility_cgpa = data.get('eligibility_cgpa')
    eligible_branches = data.get('eligible_branches')
    application_deadline_str = data.get('application_deadline')
    package_lpa = data.get('package_lpa')

    if not all([job_title, eligibility_cgpa, eligible_branches, application_deadline_str, package_lpa]):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        deadline_date = datetime.strptime(application_deadline_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    drive = PlacementDrive(
        company_id=int(get_jwt_identity()),
        job_title=job_title,
        job_description=job_description,
        eligibility_cgpa=float(eligibility_cgpa),
        package_lpa=float(package_lpa),
        application_deadline=deadline_date,
        status='pending'
    )
    drive.set_branches(eligible_branches)

    db.session.add(drive)

    # Notify admin: new drive pending review
    company = Company.query.get(int(get_jwt_identity()))
    company_name = company.name if company else 'A company'
    create_notification(
        title='New Drive Submitted',
        message=f'{company_name} posted a new opening: "{job_title}" ({package_lpa} LPA) — awaiting your review.',
        category='drive_posted'
    )

    db.session.commit()

    return jsonify({
        "message": "Drive created, awaiting Admin approval",
        "drive_id": drive.id
    }), 201

@company_bp.route('/drives', methods=['GET'])
@role_required('company')
def get_company_drives():
    company_id = int(get_jwt_identity())
    drives = PlacementDrive.query.filter_by(company_id=company_id).all()
    
    result = []
    for drive in drives:
        applicant_count = Application.query.filter_by(drive_id=drive.id).count()
        result.append({
            "id": drive.id,
            "job_title": drive.job_title,
            "status": drive.status,
            "package_lpa": drive.package_lpa,
            "application_deadline": drive.application_deadline.strftime("%Y-%m-%d") if drive.application_deadline else None,
            "eligibility_cgpa": drive.eligibility_cgpa,
            "eligible_branches": drive.get_branches(),
            "applicant_count": applicant_count
        })
    return jsonify(result), 200

@company_bp.route('/drives/<int:drive_id>', methods=['GET'])
@role_required('company')
def get_single_drive(drive_id):
    approval_check = verify_approved_company()
    if approval_check:
        return approval_check

    drive = PlacementDrive.query.get(drive_id)
    if not drive:
        return jsonify({"error": "Placement drive not found"}), 404

    if drive.company_id != int(get_jwt_identity()):
        return jsonify({"error": "Access denied"}), 403

    return jsonify({
        "id": drive.id,
        "job_title": drive.job_title,
        "job_description": drive.job_description,
        "status": drive.status,
        "package_lpa": drive.package_lpa,
        "application_deadline": drive.application_deadline.strftime("%Y-%m-%d") if drive.application_deadline else None,
        "eligibility_cgpa": drive.eligibility_cgpa,
        "eligible_branches": drive.get_branches()
    }), 200

@company_bp.route('/drives/<int:drive_id>', methods=['PUT'])
@role_required('company')
def edit_drive(drive_id):
    approval_check = verify_approved_company()
    if approval_check:
        return approval_check

    drive = PlacementDrive.query.get(drive_id)
    if not drive:
        return jsonify({"error": "Placement drive not found"}), 404

    if drive.company_id != int(get_jwt_identity()):
        return jsonify({"error": "Access denied"}), 403

    data = request.get_json() or {}
    job_title = data.get('job_title')
    job_description = data.get('job_description')
    eligibility_cgpa = data.get('eligibility_cgpa')
    eligible_branches = data.get('eligible_branches')
    application_deadline_str = data.get('application_deadline')
    package_lpa = data.get('package_lpa')

    if not all([job_title, eligibility_cgpa, eligible_branches, application_deadline_str, package_lpa]):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        deadline_date = datetime.strptime(application_deadline_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    drive.job_title = job_title
    drive.job_description = job_description
    drive.eligibility_cgpa = float(eligibility_cgpa)
    drive.package_lpa = float(package_lpa)
    drive.application_deadline = deadline_date
    drive.set_branches(eligible_branches)
    
    # Reset status to pending so admin reviews the edited drive
    drive.status = 'pending'

    # Notify admin
    company = Company.query.get(int(get_jwt_identity()))
    company_name = company.name if company else 'A company'
    create_notification(
        title='Drive Details Updated',
        message=f'{company_name} updated details for drive: "{job_title}" — awaiting your review.',
        category='drive_posted'
    )

    try:
        db.session.commit()
        try:
            cache.delete('admin_stats')
            cache.delete('approved_drives')
        except Exception:
            pass
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500

    return jsonify({"message": "Placement drive details updated successfully, awaiting Admin approval"}), 200

@company_bp.route('/drives/<int:drive_id>/close', methods=['PUT'])
@role_required('company')
def close_drive(drive_id):
    approval_check = verify_approved_company()
    if approval_check:
        return approval_check

    drive = PlacementDrive.query.get(drive_id)
    if not drive:
        return jsonify({"error": "Placement drive not found"}), 404

    if drive.company_id != int(get_jwt_identity()):
        return jsonify({"error": "Access denied"}), 403

    drive.status = 'completed'

    # Notify admin
    create_notification(
        title='Drive Completed/Closed',
        message=f'Placement drive "{drive.job_title}" has been closed by the recruiter.',
        category='info',
        role='admin'
    )

    try:
        db.session.commit()
        try:
            cache.delete('admin_stats')
            cache.delete('approved_drives')
        except Exception:
            pass
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500

    return jsonify({"message": "Placement drive has been closed successfully."}), 200

@company_bp.route('/drives/<int:drive_id>/applicants', methods=['GET'])
@role_required('company')
def get_drive_applicants(drive_id):
    drive = PlacementDrive.query.get(drive_id)
    if not drive:
        return jsonify({"error": "Placement drive not found"}), 404

    if drive.company_id != int(get_jwt_identity()):
        return jsonify({"error": "Access denied"}), 403

    applicants_data = db.session.query(
        Application.id.label('application_id'),
        Application.status.label('application_status'),
        Application.applied_on.label('applied_on'),
        Student.id.label('student_id'),
        Student.name.label('student_name'),
        Student.roll_number.label('roll_number'),
        Student.branch.label('branch'),
        Student.cgpa.label('cgpa')
    ).join(Student, Application.student_id == Student.id)\
     .filter(Application.drive_id == drive_id).all()

    result = []
    for app in applicants_data:
        result.append({
            "student_id": app.student_id,
            "student_name": app.student_name,
            "roll_number": app.roll_number,
            "branch": app.branch,
            "cgpa": app.cgpa,
            "application_id": app.application_id,
            "application_status": app.application_status,
            "applied_on": app.applied_on.strftime("%Y-%m-%d") if app.applied_on else None
        })
    return jsonify(result), 200

@company_bp.route('/applications/<int:application_id>/status', methods=['PUT'])
@role_required('company')
def update_application_status(application_id):
    approval_check = verify_approved_company()
    if approval_check:
        return approval_check

    application = Application.query.get(application_id)
    if not application:
        return jsonify({"error": "Application not found"}), 404

    drive = PlacementDrive.query.get(application.drive_id)
    if not drive or drive.company_id != int(get_jwt_identity()):
        return jsonify({"error": "Access denied"}), 403

    data = request.get_json() or {}
    new_status = data.get('status')
    if new_status not in ['shortlisted', 'selected', 'rejected']:
        return jsonify({"error": "Invalid status value"}), 400

    old_status = application.status
    application.status = new_status

    student = Student.query.get(application.student_id)
    company = Company.query.get(int(get_jwt_identity()))
    student_name = student.name if student else 'A student'
    company_name = company.name if company else 'A company'

    # Notify student
    if new_status == 'selected' and old_status != 'selected':
        create_notification(
            title='Application Selected! 🎉',
            message=f'Congratulations! You have been selected for the position of "{drive.job_title}" at {company_name}.',
            category='student_placed',
            role='student',
            user_id=application.student_id
        )
    elif new_status == 'shortlisted' and old_status != 'shortlisted':
        create_notification(
            title='Application Shortlisted!',
            message=f'Your application for "{drive.job_title}" at {company_name} has been shortlisted.',
            category='student_placed',
            role='student',
            user_id=application.student_id
        )
    elif new_status == 'rejected' and old_status != 'rejected':
        create_notification(
            title='Application Status Update',
            message=f'Your application for "{drive.job_title}" at {company_name} has been processed.',
            category='drive_rejected',
            role='student',
            user_id=application.student_id
        )

    # Notify admin when a student is placed
    if new_status == 'selected' and old_status != 'selected':
        create_notification(
            title='Student Placed!',
            message=f'{student_name} was selected by {company_name} for "{drive.job_title}".',
            category='student_placed',
            role='admin'
        )

    db.session.commit()

    return jsonify({"message": "Application status updated successfully"}), 200

@company_bp.route('/drives/<int:drive_id>/interview', methods=['POST'])
@role_required('company')
def schedule_interview(drive_id):
    approval_check = verify_approved_company()
    if approval_check:
        return approval_check

    drive = PlacementDrive.query.get(drive_id)
    if not drive:
        return jsonify({"error": "Placement drive not found"}), 404

    if drive.company_id != int(get_jwt_identity()):
        return jsonify({"error": "Access denied"}), 403

    existing_schedule = InterviewSchedule.query.filter_by(drive_id=drive_id).first()
    if existing_schedule:
        return jsonify({"error": "Interview already scheduled for this drive"}), 400

    data = request.get_json() or {}
    interview_date_str = data.get('interview_date')
    interview_mode = data.get('interview_mode')
    location_or_link = data.get('location_or_link')
    notes = data.get('notes')

    if not all([interview_date_str, interview_mode]):
        return jsonify({"error": "Missing required fields"}), 400

    if interview_mode not in ['online', 'offline']:
        return jsonify({"error": "Invalid interview mode"}), 400

    try:
        interview_date = datetime.strptime(interview_date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    schedule = InterviewSchedule(
        drive_id=drive_id,
        interview_date=interview_date,
        interview_mode=interview_mode,
        location_or_link=location_or_link,
        notes=notes
    )

    db.session.add(schedule)

    # Notify all non-rejected applicants about the scheduled interview
    try:
        company = Company.query.get(int(get_jwt_identity()))
        company_name = company.name if company else 'Company'
        applications = Application.query.filter_by(drive_id=drive_id).filter(Application.status != 'rejected').all()
        for app in applications:
            create_notification(
                title='Interview Scheduled!',
                message=f'An interview has been scheduled for "{drive.job_title}" at {company_name} on {interview_date_str} ({interview_mode}). Check details in My Interviews.',
                category='info',
                role='student',
                user_id=app.student_id
            )
    except Exception:
        pass

    db.session.commit()

    return jsonify({"message": "Interview scheduled successfully"}), 201

@company_bp.route('/dashboard/funnel', methods=['GET'])
@role_required('company')
def get_funnel_stats():
    company_id = int(get_jwt_identity())
    
    stats = db.session.query(
        Application.status,
        db.func.count(Application.id)
    ).join(PlacementDrive, Application.drive_id == PlacementDrive.id)\
     .filter(PlacementDrive.company_id == company_id)\
     .group_by(Application.status).all()

    stats_dict = {"applied": 0, "shortlisted": 0, "selected": 0, "rejected": 0}
    for status, count in stats:
        if status in stats_dict:
            stats_dict[status] = count

    return jsonify(stats_dict), 200

# ==========================================
# NEW COMPANY STUDENT PROFILE & RESUME VIEW ROUTES
# ==========================================

def check_company_student_access(company_id, student_id):
    """Verifies student has applied to at least one drive belonging to company_id."""
    has_applied = db.session.query(Application.id).join(
        PlacementDrive, Application.drive_id == PlacementDrive.id
    ).filter(
        PlacementDrive.company_id == company_id,
        Application.student_id == student_id
    ).first()
    return has_applied is not None

@company_bp.route('/students/<int:student_id>/profile', methods=['GET'])
@role_required('company')
def get_student_profile_for_company(student_id):
    company_id = int(get_jwt_identity())
    if not check_company_student_access(company_id, student_id):
        return jsonify({"error": "Access denied"}), 403

    student = Student.query.get(student_id)
    if not student:
        return jsonify({"error": "Student not found"}), 404

    return jsonify({
        "id": student.id,
        "name": student.name,
        "roll_number": student.roll_number,
        "branch": student.branch,
        "cgpa": student.cgpa,
        "graduation_year": student.graduation_year,
        "linkedin_url": student.linkedin_url,
        "github_url": student.github_url,
        "portfolio_url": student.portfolio_url,
        "bio": student.bio,
        "skills": student.get_skills(),
        "resume_url": student.resume_url
    }), 200

@company_bp.route('/students/<int:student_id>/resume', methods=['GET'])
@role_required('company')
def get_student_resume_for_company(student_id):
    company_id = int(get_jwt_identity())
    if not check_company_student_access(company_id, student_id):
        return jsonify({"error": "Access denied"}), 403

    student = Student.query.get(student_id)
    if not student or not student.resume_url:
        return jsonify({"error": "No resume uploaded"}), 404

    import tempfile
    file_path = os.path.join(tempfile.gettempdir(), student.resume_url.replace('/', os.sep))

    if not os.path.exists(file_path):
        return jsonify({"error": "Resume file not found on server"}), 404

    return send_file(file_path, mimetype='application/pdf')


@company_bp.route('/dashboard/summary', methods=['GET'])
@role_required('company')
def get_company_dashboard_summary():
    company_id = int(get_jwt_identity())
    
    # Drives created by company
    drives = PlacementDrive.query.filter_by(company_id=company_id).all()
    drive_ids = [d.id for d in drives]
    active_drives_count = sum(1 for d in drives if d.status == 'approved')
    pending_drives_count = sum(1 for d in drives if d.status == 'pending')

    # Applications for company drives
    apps = Application.query.filter(Application.drive_id.in_(drive_ids)).all() if drive_ids else []
    total_applicants = len(apps)
    shortlisted_count = sum(1 for a in apps if a.status == 'shortlisted')
    selected_count = sum(1 for a in apps if a.status == 'selected')
    rejected_count = sum(1 for a in apps if a.status == 'rejected')
    applied_count = sum(1 for a in apps if a.status == 'applied')

    # Calculate average CGPA & branch breakdown of applicants
    branch_counts = {}
    total_cgpa = 0.0
    valid_cgpa_count = 0

    if apps:
        student_ids = list(set(a.student_id for a in apps))
        students = Student.query.filter(Student.id.in_(student_ids)).all()
        for s in students:
            branch_counts[s.branch] = branch_counts.get(s.branch, 0) + 1
            if s.cgpa:
                total_cgpa += s.cgpa
                valid_cgpa_count += 1

    avg_cgpa = round(total_cgpa / valid_cgpa_count, 2) if valid_cgpa_count > 0 else 0.0
    hiring_rate = round((selected_count / total_applicants * 100), 1) if total_applicants > 0 else 0.0

    # Drive status list for widget
    drive_status_list = []
    for d in drives:
        app_cnt = sum(1 for a in apps if a.drive_id == d.id)
        drive_status_list.append({
            "id": d.id,
            "job_title": d.job_title,
            "status": d.status,
            "applicant_count": app_cnt
        })

    # Recent applicants (latest 5)
    recent_apps_query = db.session.query(
        Application.id,
        Application.status,
        Application.applied_on,
        Student.name.label('student_name'),
        Student.roll_number,
        Student.cgpa,
        Student.branch,
        PlacementDrive.job_title
    ).join(Student, Application.student_id == Student.id)\
     .join(PlacementDrive, Application.drive_id == PlacementDrive.id)\
     .filter(PlacementDrive.company_id == company_id)\
     .order_by(Application.applied_on.desc()).limit(5).all()

    recent_applicants = [{
        "application_id": app.id,
        "student_name": app.student_name,
        "roll_number": app.roll_number,
        "cgpa": app.cgpa,
        "branch": app.branch,
        "drive": app.job_title,
        "applied_on": app.applied_on.strftime("%d %b") if app.applied_on else "",
        "status": app.status
    } for app in recent_apps_query]

    # Weekly applications static calculation fallback
    weekly_applications = [
        {"day": "Mon", "count": int(total_applicants * 0.15)},
        {"day": "Tue", "count": int(total_applicants * 0.20)},
        {"day": "Wed", "count": int(total_applicants * 0.25)},
        {"day": "Thu", "count": int(total_applicants * 0.25)},
        {"day": "Fri", "count": int(total_applicants * 0.15)},
    ]

    return jsonify({
        "active_drives": active_drives_count,
        "pending_drives": pending_drives_count,
        "total_applicants": total_applicants,
        "shortlisted": shortlisted_count,
        "interviewed": shortlisted_count + selected_count,
        "selected": selected_count,
        "rejected": rejected_count,
        "offers_extended": selected_count,
        "hiring_rate": hiring_rate,
        "average_cgpa": avg_cgpa,
        "funnel": {
            "applied": applied_count + shortlisted_count + selected_count + rejected_count,
            "shortlisted": shortlisted_count,
            "interviewed": shortlisted_count + selected_count,
            "selected": selected_count
        },
        "branch_distribution": [{"branch": k, "count": v} for k, v in branch_counts.items()],
        "weekly_applications": weekly_applications,
        "recent_applicants": recent_applicants,
        "drive_status_list": drive_status_list
    }), 200

