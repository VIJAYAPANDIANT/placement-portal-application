import os
import json
from flask import Blueprint, request, jsonify, send_file, current_app
from flask_jwt_extended import get_jwt_identity
from datetime import date, datetime
from werkzeug.utils import secure_filename
from app import db, cache
from app.models.company import Company
from app.models.drive import PlacementDrive
from app.models.application import Application
from app.models.student import Student
from app.models.interview import InterviewSchedule
from app.models.notification import create_notification
from app.utils.decorators import role_required
from app.tasks.celery_tasks import export_student_applications_csv

student_bp = Blueprint('student_bp', __name__)

@student_bp.route('/drives', methods=['GET'])
@role_required('student')
@cache.cached(timeout=300, key_prefix='approved_drives')
def get_student_drives():
    drives_data = db.session.query(
        PlacementDrive, Company.name.label('company_name'), Company.industry.label('company_industry')
    ).join(Company, PlacementDrive.company_id == Company.id)\
     .filter(PlacementDrive.status == 'approved')\
     .filter(Company.approval_status == 'approved').all()

    result = []
    for drive, comp_name, comp_ind in drives_data:
        result.append({
            "id": drive.id,
            "job_title": drive.job_title,
            "job_description": drive.job_description,
            "package_lpa": drive.package_lpa,
            "application_deadline": drive.application_deadline.strftime("%Y-%m-%d") if drive.application_deadline else None,
            "eligibility_cgpa": drive.eligibility_cgpa,
            "eligible_branches": drive.get_branches(),
            "company_name": comp_name,
            "company_industry": comp_ind
        })

    return jsonify(result), 200

@student_bp.route('/drives/<int:drive_id>/apply', methods=['POST'])
@role_required('student')
def apply_to_drive(drive_id):
    student = Student.query.get(int(get_jwt_identity()))
    if not student:
        return jsonify({"error": "Student not found"}), 404

    drive = PlacementDrive.query.get(drive_id)
    if not drive:
        return jsonify({"error": "Placement drive not found"}), 404

    if student.cgpa < drive.eligibility_cgpa:
        return jsonify({
            "error": "CGPA does not meet eligibility requirement",
            "message": "CGPA does not meet eligibility requirement"
        }), 400

    # Branch compatibility check
    student_branch = student.branch
    eligible_branches = drive.get_branches()
    
    def get_equivalent_branches(br):
        if not br:
            return []
        mapping = {
            'cse': ['computer science', 'cse', 'computer science (cse)'],
            'computer science': ['computer science', 'cse', 'computer science (cse)'],
            'it': ['information technology', 'it', 'information technology (it)'],
            'information technology': ['information technology', 'it', 'information technology (it)'],
            'aiml': ['artificial intelligence', 'aiml', 'artificial intelligence & machine learning (aiml)', 'artificial intelligence & machine learning'],
            'artificial intelligence': ['artificial intelligence', 'aiml', 'artificial intelligence & machine learning (aiml)', 'artificial intelligence & machine learning'],
            'ece': ['electronics & communication', 'ece', 'electronics & communication (ece)'],
            'electronics & communication': ['electronics & communication', 'ece', 'electronics & communication (ece)'],
            'eee': ['electrical & electronics', 'eee', 'electrical & electronics (eee)'],
            'electrical & electronics': ['electrical & electronics', 'eee', 'electrical & electronics (eee)'],
            'mech': ['mechanical engineering', 'mechanical', 'mechanical engineering (mech)', 'mech'],
            'mechanical': ['mechanical engineering', 'mechanical', 'mechanical engineering (mech)', 'mech'],
            'mechanical engineering': ['mechanical engineering', 'mechanical', 'mechanical engineering (mech)', 'mech'],
            'civil': ['civil engineering', 'civil', 'civil engineering (civil)', 'civil'],
            'civil engineering': ['civil engineering', 'civil', 'civil engineering (civil)', 'civil'],
            'ds': ['data science', 'ds', 'data science (ds)'],
            'data science': ['data science', 'ds', 'data science (ds)']
        }
        return mapping.get(br.lower().strip(), [br.lower().strip()])

    student_equivs = get_equivalent_branches(student_branch)
    is_eligible = False
    for b in eligible_branches:
        b_equivs = get_equivalent_branches(b)
        if any(eq in student_equivs for eq in b_equivs) or b.lower().strip() == student_branch.lower().strip():
            is_eligible = True
            break

    if not is_eligible:
        return jsonify({
            "error": "Your branch is not eligible for this drive",
            "message": "Your branch is not eligible for this drive"
        }), 400

    existing = Application.query.filter_by(student_id=student.id, drive_id=drive_id).first()
    if existing:
        return jsonify({
            "error": "You have already applied to this drive",
            "message": "You have already applied to this drive"
        }), 400

    application = Application(
        student_id=student.id,
        drive_id=drive_id,
        applied_on=date.today(),
        status='applied'
    )
    db.session.add(application)

    # 1. Fetch company details
    company = Company.query.get(drive.company_id)
    company_name = company.name if company else "Company"

    # 2. Notify student
    create_notification(
        title='Application Submitted',
        message=f'You have successfully applied for "{drive.job_title}" at {company_name}.',
        category='info',
        role='student',
        user_id=student.id
    )

    # 3. Notify company
    create_notification(
        title='New Candidate Application',
        message=f'New applicant: {student.name} ({student.branch}, CGPA: {student.cgpa}) has applied to your "{drive.job_title}" drive.',
        category='drive_posted',
        role='company',
        user_id=drive.company_id
    )

    # 4. Notify admin
    create_notification(
        title='New Drive Application',
        message=f'{student.name} applied to "{drive.job_title}" by {company_name}.',
        category='info',
        role='admin'
    )

    db.session.commit()

    return jsonify({"message": "Application submitted successfully"}), 201

@student_bp.route('/applications', methods=['GET'])
@role_required('student')
def get_student_applications():
    student_id = int(get_jwt_identity())

    applications_data = db.session.query(
        Application.id.label('app_id'),
        Application.status.label('app_status'),
        Application.applied_on.label('app_applied_on'),
        PlacementDrive.job_title.label('job_title'),
        PlacementDrive.package_lpa.label('package_lpa'),
        Company.name.label('company_name')
    ).join(PlacementDrive, Application.drive_id == PlacementDrive.id)\
     .join(Company, PlacementDrive.company_id == Company.id)\
     .filter(Application.student_id == student_id).all()

    result = []
    for app in applications_data:
        result.append({
            "id": app.app_id,
            "status": app.app_status,
            "applied_on": app.app_applied_on.strftime("%Y-%m-%d") if app.app_applied_on else None,
            "job_title": app.job_title,
            "package_lpa": app.package_lpa,
            "company_name": app.company_name
        })

    return jsonify(result), 200

@student_bp.route('/interviews', methods=['GET'])
@role_required('student')
def get_student_interviews():
    student_id = int(get_jwt_identity())

    interviews_data = db.session.query(
        InterviewSchedule.interview_date.label('interview_date'),
        InterviewSchedule.interview_mode.label('interview_mode'),
        InterviewSchedule.location_or_link.label('location_or_link'),
        InterviewSchedule.notes.label('notes'),
        PlacementDrive.job_title.label('job_title'),
        Company.name.label('company_name')
    ).join(PlacementDrive, InterviewSchedule.drive_id == PlacementDrive.id)\
     .join(Company, PlacementDrive.company_id == Company.id)\
     .join(Application, Application.drive_id == PlacementDrive.id)\
     .filter(Application.student_id == student_id)\
     .filter(Application.status.in_(['shortlisted', 'selected'])).all()

    result = []
    for iv in interviews_data:
        result.append({
            "interview_date": iv.interview_date.strftime("%Y-%m-%d") if iv.interview_date else None,
            "interview_mode": iv.interview_mode,
            "location_or_link": iv.location_or_link,
            "notes": iv.notes,
            "job_title": iv.job_title,
            "company_name": iv.company_name
        })

    return jsonify(result), 200

@student_bp.route('/dashboard/status-breakdown', methods=['GET'])
@role_required('student')
def get_status_breakdown():
    student_id = int(get_jwt_identity())

    stats = db.session.query(
        Application.status,
        db.func.count(Application.id)
    ).filter(Application.student_id == student_id)\
     .group_by(Application.status).all()

    stats_dict = {"applied": 0, "shortlisted": 0, "selected": 0, "rejected": 0}
    for status, count in stats:
        if status in stats_dict:
            stats_dict[status] = count

    return jsonify(stats_dict), 200

@student_bp.route('/export-csv', methods=['POST'])
@role_required('student')
def export_csv():
    student_id = int(get_jwt_identity())
    student = Student.query.get(student_id)
    if not student:
        return jsonify({"error": "Student not found"}), 404
        
    current_app.celery.send_task('app.tasks.celery_tasks.export_student_applications_csv', args=[student_id, student.email])
    return jsonify({"message": "Export started, you will receive an email shortly"}), 200


@student_bp.route('/download-csv', methods=['GET'])
@role_required('student')
def download_csv():
    student_id = int(get_jwt_identity())
    apps = db.session.query(
        Company.name.label('company_name'),
        PlacementDrive.job_title,
        PlacementDrive.package_lpa,
        Application.applied_on,
        Application.status
    ).join(PlacementDrive, Application.drive_id == PlacementDrive.id)\
     .join(Company, PlacementDrive.company_id == Company.id)\
     .filter(Application.student_id == student_id).all()

    csv_lines = ["Company,Job Title,Package LPA,Applied On,Status"]
    for app in apps:
        applied_str = app.applied_on.strftime("%Y-%m-%d") if app.applied_on else ""
        csv_lines.append(f"{app.company_name},{app.job_title},{app.package_lpa},{applied_str},{app.status}")
    
    csv_content = "\n".join(csv_lines) + "\n"

    from flask import Response
    return Response(
        csv_content,
        mimetype="text/csv",
        headers={"Content-disposition": "attachment; filename=applications.csv"}
    )

# ==========================================
# NEW STUDENT PROFILE ROUTES
# ==========================================

@student_bp.route('/profile', methods=['GET'])
@role_required('student')
def get_profile():
    student_id = int(get_jwt_identity())
    student = Student.query.get(student_id)
    if not student:
        return jsonify({"error": "Student not found"}), 404

    skills_list = student.get_skills()

    # Calculate profile completeness across 12 fields
    fields = [
        student.name, student.email, student.roll_number, student.branch,
        student.cgpa, student.graduation_year, student.resume_url,
        student.linkedin_url, student.github_url, student.portfolio_url,
        student.bio, skills_list
    ]

    filled_count = 0
    for val in fields:
        if val is not None and val != '' and val != []:
            filled_count += 1

    profile_completeness = round((filled_count / 12.0) * 100)

    return jsonify({
        "id": student.id,
        "name": student.name,
        "email": student.email,
        "roll_number": student.roll_number,
        "branch": student.branch,
        "cgpa": student.cgpa,
        "graduation_year": student.graduation_year,
        "resume_url": student.resume_url,
        "linkedin_url": student.linkedin_url,
        "github_url": student.github_url,
        "portfolio_url": student.portfolio_url,
        "bio": student.bio,
        "skills": skills_list,
        "profile_completeness": profile_completeness
    }), 200

@student_bp.route('/profile', methods=['PUT'])
@role_required('student')
def update_profile():
    student_id = int(get_jwt_identity())
    student = Student.query.get(student_id)
    if not student:
        return jsonify({"error": "Student not found"}), 404

    data = request.get_json() or {}

    if 'linkedin_url' in data:
        student.linkedin_url = data['linkedin_url']
    if 'github_url' in data:
        student.github_url = data['github_url']
    if 'portfolio_url' in data:
        student.portfolio_url = data['portfolio_url']
    if 'bio' in data:
        student.bio = data['bio']
    if 'skills' in data:
        student.set_skills(data['skills'])

    db.session.commit()
    return jsonify({"message": "Profile updated successfully"}), 200

@student_bp.route('/upload-resume', methods=['POST'])
@role_required('student')
def upload_resume():
    student_id = int(get_jwt_identity())
    student = Student.query.get(student_id)
    if not student:
        return jsonify({"error": "Student not found"}), 404

    if 'resume' not in request.files:
        return jsonify({"error": "No resume file provided"}), 400

    file = request.files['resume']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if not file.filename.lower().endswith('.pdf'):
        return jsonify({"error": "Only PDF files allowed"}), 400

    # Save to tempdir/uploads/resumes/<student_id>.pdf
    import tempfile
    upload_folder = os.path.join(tempfile.gettempdir(), 'uploads', 'resumes')
    os.makedirs(upload_folder, exist_ok=True)

    filename = f"{student_id}.pdf"
    file_path = os.path.join(upload_folder, filename)
    file.save(file_path)

    rel_url = f"uploads/resumes/{filename}"
    student.resume_url = rel_url
    db.session.commit()

    return jsonify({
        "message": "Resume uploaded",
        "resume_url": rel_url
    }), 200


@student_bp.route('/dashboard/summary', methods=['GET'])
@role_required('student')
def get_student_dashboard_summary():
    student_id = int(get_jwt_identity())
    student = Student.query.get(student_id)
    if not student:
        return jsonify({"error": "Student not found"}), 404

    # Calculate profile completeness
    skills_list = student.get_skills()
    fields = [
        student.name, student.email, student.roll_number, student.branch,
        student.cgpa, student.graduation_year, student.resume_url,
        student.linkedin_url, student.github_url, student.portfolio_url,
        student.bio, skills_list
    ]
    filled_count = sum(1 for val in fields if val is not None and val != '' and val != [])
    profile_completeness = round((filled_count / 12.0) * 100)

    # Calculate drives student is eligible for
    all_approved_drives = db.session.query(PlacementDrive).join(
        Company, PlacementDrive.company_id == Company.id
    ).filter(
        PlacementDrive.status == 'approved',
        Company.approval_status == 'approved'
    ).all()

    eligible_drives_count = 0
    for drive in all_approved_drives:
        if student.cgpa >= drive.eligibility_cgpa and student.branch in drive.get_branches():
            eligible_drives_count += 1

    # Student applications
    apps = Application.query.filter_by(student_id=student_id).all()
    applied_count = len(apps)
    shortlisted_count = sum(1 for a in apps if a.status == 'shortlisted')
    selected_count = sum(1 for a in apps if a.status == 'selected')
    rejected_count = sum(1 for a in apps if a.status == 'rejected')

    # Upcoming interview
    next_interview = db.session.query(
        InterviewSchedule.interview_date,
        InterviewSchedule.interview_mode,
        InterviewSchedule.location_or_link,
        PlacementDrive.job_title,
        Company.name.label('company_name')
    ).join(PlacementDrive, InterviewSchedule.drive_id == PlacementDrive.id)\
     .join(Company, PlacementDrive.company_id == Company.id)\
     .join(Application, Application.drive_id == PlacementDrive.id)\
     .filter(Application.student_id == student_id, Application.status.in_(['shortlisted', 'selected']))\
     .order_by(InterviewSchedule.interview_date.asc()).first()

    interview_data = None
    if next_interview:
        interview_data = {
            "date": next_interview.interview_date.strftime("%Y-%m-%d"),
            "mode": next_interview.interview_mode,
            "location_or_link": next_interview.location_or_link,
            "job_title": next_interview.job_title,
            "company_name": next_interview.company_name
        }

    # Status breakdown for pie chart
    status_breakdown = {
        "applied": applied_count,
        "shortlisted": shortlisted_count,
        "selected": selected_count,
        "rejected": rejected_count
    }

    # Recent applications (latest 5)
    recent_apps_query = db.session.query(
        Application.id,
        Application.status,
        Application.applied_on,
        PlacementDrive.job_title,
        PlacementDrive.package_lpa,
        Company.name.label('company_name')
    ).join(PlacementDrive, Application.drive_id == PlacementDrive.id)\
     .join(Company, PlacementDrive.company_id == Company.id)\
     .filter(Application.student_id == student_id)\
     .order_by(Application.applied_on.desc()).limit(5).all()

    recent_applications = [{
        "id": app.id,
        "status": app.status,
        "applied_on": app.applied_on.strftime("%Y-%m-%d") if app.applied_on else None,
        "job_title": app.job_title,
        "package_lpa": app.package_lpa,
        "company_name": app.company_name
    } for app in recent_apps_query]

    return jsonify({
        "eligible_drives": eligible_drives_count,
        "applied_drives": applied_count,
        "interview_count": shortlisted_count + selected_count,
        "offer_count": selected_count,
        "placement_status": "Placed" if selected_count > 0 else "In Progress",
        "cgpa": student.cgpa,
        "profile_completion": profile_completeness,
        "resume_uploaded": bool(student.resume_url),
        "status_breakdown": status_breakdown,
        "recent_applications": recent_applications,
        "upcoming_interview": interview_data
    }), 200

