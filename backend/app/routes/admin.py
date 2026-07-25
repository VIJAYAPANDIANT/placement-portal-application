from flask import Blueprint, request, jsonify
from datetime import date
from app import db, cache
from app.utils.decorators import role_required
from app.models import Company, Student, PlacementDrive, Application

# Define the Blueprint for admin-side endpoints
admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/companies/pending', methods=['GET'])
@role_required('admin')
def get_pending_companies():
    """
    GET /companies/pending
    Returns all Company records where approval_status == 'pending'.
    """
    companies = Company.query.filter_by(approval_status='pending').all()
    response_data = []
    for company in companies:
        response_data.append({
            'id': company.id,
            'name': company.name,
            'email': company.email,
            'industry': company.industry,
            'approval_status': company.approval_status
        })
    return jsonify(response_data), 200


@admin_bp.route('/companies/<int:company_id>/approve', methods=['PUT'])
@role_required('admin')
def approve_company(company_id):
    """
    PUT /companies/<int:company_id>/approve
    Accepts JSON body: {"action": "approve" or "reject", "remarks": "optional text"}
    Sets approval_status based on action.
    """
    company = db.session.get(Company, company_id)
    if not company:
        return jsonify({'message': 'Company not found'}), 404

    data = request.get_json() or {}
    action = data.get('action')

    if action not in ['approve', 'reject']:
        return jsonify({'message': 'Invalid action. Must be "approve" or "reject"'}), 400

    if action == 'approve':
        company.approval_status = 'approved'
        message = 'Company approved successfully'
    else:
        company.approval_status = 'rejected'
        message = 'Company rejected successfully'

    try:
        db.session.commit()
        try:
            cache.delete('admin_stats')
        except Exception:
            pass
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Database error: {str(e)}'}), 500

    return jsonify({'message': message}), 200


@admin_bp.route('/companies/<int:company_id>/deactivate', methods=['PUT'])
@role_required('admin')
def deactivate_company(company_id):
    """
    PUT /companies/<int:company_id>/deactivate
    Sets Company.is_active = False.
    """
    company = db.session.get(Company, company_id)
    if not company:
        return jsonify({'message': 'Company not found'}), 404

    company.is_active = False

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Database error: {str(e)}'}), 500

    return jsonify({'message': 'Company deactivated successfully'}), 200


@admin_bp.route('/drives/pending', methods=['GET'])
@role_required('admin')
def get_pending_drives():
    """
    GET /drives/pending
    Returns all PlacementDrive records where status == 'pending', joined with Company table.
    """
    results = db.session.query(PlacementDrive, Company.name).join(
        Company, PlacementDrive.company_id == Company.id
    ).filter(
        PlacementDrive.status == 'pending'
    ).all()

    response_data = []
    for drive, company_name in results:
        response_data.append({
            'id': drive.id,
            'job_title': drive.job_title,
            'company_name': company_name,
            'eligibility_cgpa': drive.eligibility_cgpa,
            'package_lpa': drive.package_lpa
        })
    return jsonify(response_data), 200


@admin_bp.route('/drives/<int:drive_id>/approve', methods=['PUT'])
@role_required('admin')
def approve_drive(drive_id):
    """
    PUT /drives/<int:drive_id>/approve
    Accepts JSON body: {"action": "approve" or "reject"}
    Updates status accordingly.
    """
    drive = db.session.get(PlacementDrive, drive_id)
    if not drive:
        return jsonify({'message': 'Placement drive not found'}), 404

    data = request.get_json() or {}
    action = data.get('action')

    if action not in ['approve', 'reject']:
        return jsonify({'message': 'Invalid action. Must be "approve" or "reject"'}), 400

    if action == 'approve':
        drive.status = 'approved'
        message = 'Placement drive approved successfully'
    else:
        drive.status = 'rejected'
        message = 'Placement drive rejected successfully'

    try:
        db.session.commit()
        try:
            cache.delete('admin_stats')
        except Exception:
            pass
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Database error: {str(e)}'}), 500

    return jsonify({'message': message}), 200


@admin_bp.route('/students/<int:student_id>/blacklist', methods=['PUT'])
@role_required('admin')
def blacklist_student(student_id):
    """
    PUT /students/<int:student_id>/blacklist
    Toggles Student.is_blacklisted between True/False.
    """
    student = db.session.get(Student, student_id)
    if not student:
        return jsonify({'message': 'Student not found'}), 404

    student.is_blacklisted = not student.is_blacklisted

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Database error: {str(e)}'}), 500

    return jsonify({
        'message': 'Student blacklist status updated successfully',
        'is_blacklisted': student.is_blacklisted
    }), 200


@admin_bp.route('/dashboard/stats', methods=['GET'])
@role_required('admin')
@cache.cached(timeout=600, key_prefix='admin_stats')
def get_dashboard_stats():
    """
    GET /dashboard/stats
    Returns counts for total_students, total_companies (approved), total_drives (approved), total_selections.
    """
    total_students = Student.query.count()
    total_companies = Company.query.filter_by(approval_status='approved').count()
    total_drives = PlacementDrive.query.filter_by(status='approved').count()
    total_selections = Application.query.filter_by(status='selected').count()

    return jsonify({
        'total_students': total_students,
        'total_companies': total_companies,
        'total_drives': total_drives,
        'total_selections': total_selections
    }), 200


@admin_bp.route('/dashboard/branch-placement-rate', methods=['GET'])
@role_required('admin')
def get_branch_placement_rate():
    """
    GET /dashboard/branch-placement-rate
    Calculates placement rate = (selected count / total count) * 100 for each unique branch.
    """
    # Query total students in each branch
    branch_totals = db.session.query(
        Student.branch,
        db.func.count(Student.id)
    ).group_by(Student.branch).all()

    # Select construct for students who have at least one selection
    selected_students_select = db.select(Application.student_id).filter(
        Application.status == 'selected'
    ).distinct()

    # Query count of selected students in each branch
    branch_selections = db.session.query(
        Student.branch,
        db.func.count(Student.id)
    ).filter(
        Student.id.in_(selected_students_select)
    ).group_by(Student.branch).all()

    selections_dict = {branch: count for branch, count in branch_selections}

    response_data = []
    for branch, total_count in branch_totals:
        selected_count = selections_dict.get(branch, 0)
        placement_rate = (selected_count / total_count) * 100 if total_count > 0 else 0.0
        response_data.append({
            'branch': branch,
            'placement_rate': round(placement_rate, 2)
        })

    return jsonify(response_data), 200


@admin_bp.route('/dashboard/drive-trend', methods=['GET'])
@role_required('admin')
def get_drive_trend():
    """
    GET /dashboard/drive-trend
    Returns application count per month for the current year.
    """
    current_year = date.today().year

    # Query application count grouped by month for the current year
    results = db.session.query(
        db.func.strftime('%m', Application.applied_on).label('month_num'),
        db.func.count(Application.id).label('count')
    ).filter(
        db.func.strftime('%Y', Application.applied_on) == str(current_year)
    ).group_by(
        'month_num'
    ).all()

    # Map month numbers to month names
    months_list = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]
    monthly_counts = {month: 0 for month in months_list}

    for month_num_str, count in results:
        if month_num_str:
            month_idx = int(month_num_str) - 1
            if 0 <= month_idx < 12:
                monthly_counts[months_list[month_idx]] = count

    response_data = [{'month': month, 'count': monthly_counts[month]} for month in months_list]

    return jsonify(response_data), 200


@admin_bp.route('/students', methods=['GET'])
@role_required('admin')
def get_all_students():
    """
    GET /students
    Returns all Student records from the database.
    """
    students = Student.query.all()
    response_data = []
    for student in students:
        response_data.append({
            'id': student.id,
            'name': student.name,
            'email': student.email,
            'roll_number': student.roll_number,
            'branch': student.branch,
            'cgpa': student.cgpa,
            'is_blacklisted': student.is_blacklisted,
            'is_active': student.is_active
        })
    return jsonify(response_data), 200
