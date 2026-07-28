import json
from datetime import date, timedelta
from app import create_app, db
from app.models.admin import Admin
from app.models.company import Company
from app.models.drive import PlacementDrive
from werkzeug.security import generate_password_hash

def seed_database(app_context_open=False):
    """
    Programmatically seeds the database with the pre-seeded Admin superuser
    and 16 realistic demo tech companies + approved placement drives.
    """
    def _seed():
        # 1. Seed default superuser Admin account as mandated by specification
        if not Admin.query.first():
            print("No admin user found. Creating default admin account...")
            hashed_pwd = generate_password_hash("admin123")
            admin_user = Admin(email="admin@placement.com", password_hash=hashed_pwd)
            db.session.add(admin_user)
            db.session.commit()
            print("Default admin created successfully: admin@placement.com / admin123")

        # 2. Seed 16 realistic tech companies and approved placement drives for high-impact demonstrations
        if Company.query.count() == 0:
            print("No companies found. Seeding 16+ realistic tech companies and active job drives...")
            default_pwd = generate_password_hash("company123")
            
            companies_data = [
                {"name": "Google", "email": "hr@google.com", "industry": "Internet & Software", "website": "https://careers.google.com", "hr": "Sundar P.", "title": "Software Engineer (L3)", "pkg": 45.0, "cgpa": 8.0, "branches": ["Computer Science", "Information Technology", "Data Science", "Electronics"]},
                {"name": "Microsoft", "email": "hr@microsoft.com", "industry": "Software & Cloud", "website": "https://careers.microsoft.com", "hr": "Satya N.", "title": "Cloud Solutions Developer", "pkg": 42.0, "cgpa": 7.5, "branches": ["Computer Science", "Information Technology", "Data Science", "Electronics", "Electrical"]},
                {"name": "Amazon", "email": "hr@amazon.com", "industry": "E-Commerce & Cloud", "website": "https://amazon.jobs", "hr": "Andy J.", "title": "Software Development Engineer (SDE-1)", "pkg": 38.0, "cgpa": 7.2, "branches": ["Computer Science", "Information Technology", "Data Science", "Electronics", "Mechanical"]},
                {"name": "Adobe", "email": "hr@adobe.com", "industry": "Creative & Software", "website": "https://adobe.com/careers", "hr": "Shantanu N.", "title": "Product Engineer & Research Analyst", "pkg": 32.0, "cgpa": 7.8, "branches": ["Computer Science", "Information Technology", "Data Science"]},
                {"name": "Goldman Sachs", "email": "hr@gs.com", "industry": "Investment & FinTech", "website": "https://goldmansachs.com/careers", "hr": "David S.", "title": "Technology Analyst & Quant Developer", "pkg": 28.0, "cgpa": 7.5, "branches": ["Computer Science", "Information Technology", "Data Science", "Electronics", "Electrical", "Mechanical"]},
                {"name": "Qualcomm", "email": "hr@qualcomm.com", "industry": "Semiconductors & AI", "website": "https://qualcomm.com/careers", "hr": "Cristiano A.", "title": "Embedded Systems Engineer", "pkg": 26.0, "cgpa": 7.5, "branches": ["Computer Science", "Electronics", "Electrical"]},
                {"name": "Oracle", "email": "hr@oracle.com", "industry": "Database & Enterprise Cloud", "website": "https://oracle.com/careers", "hr": "Safra C.", "title": "Enterprise Database Architect", "pkg": 24.0, "cgpa": 7.0, "branches": ["Computer Science", "Information Technology", "Data Science"]},
                {"name": "Cisco", "email": "hr@cisco.com", "industry": "Networking & Cybersecurity", "website": "https://cisco.com/careers", "hr": "Chuck R.", "title": "Network Systems Security Engineer", "pkg": 22.0, "cgpa": 7.0, "branches": ["Computer Science", "Information Technology", "Electronics", "Electrical"]},
                {"name": "IBM", "email": "hr@ibm.com", "industry": "Artificial Intelligence & Cloud", "website": "https://ibm.com/careers", "hr": "Arvind K.", "title": "AI & Quantum Solutions Associate", "pkg": 18.0, "cgpa": 6.8, "branches": ["Computer Science", "Information Technology", "Data Science", "Electronics", "Electrical"]},
                {"name": "Accenture", "email": "hr@accenture.com", "industry": "Information Technology Consulting", "website": "https://accenture.com/careers", "hr": "Julie S.", "title": "Advanced Technology Analyst", "pkg": 12.0, "cgpa": 6.5, "branches": ["Computer Science", "Information Technology", "Electronics", "Electrical", "Mechanical", "Civil"]},
                {"name": "Infosys", "email": "hr@infosys.com", "industry": "IT Services & Consulting", "website": "https://infosys.com/careers", "hr": "Salil P.", "title": "Specialist Programmer (Power Programmer)", "pkg": 9.5, "cgpa": 6.5, "branches": ["Computer Science", "Information Technology", "Electronics", "Electrical", "Mechanical"]},
                {"name": "Tech Mahindra", "email": "hr@techmahindra.com", "industry": "Telecommunications & IT", "website": "https://techmahindra.com", "hr": "C. P. Gurnani", "title": "Telecom & Cloud Security Specialist", "pkg": 8.0, "cgpa": 6.5, "branches": ["Computer Science", "Information Technology", "Electronics"]},
                {"name": "TCS", "email": "hr@tcs.com", "industry": "IT Consulting & Software", "website": "https://tcs.com/careers", "hr": "K. Krithivasan", "title": "Digital Ninja Software Developer", "pkg": 7.5, "cgpa": 6.0, "branches": ["Computer Science", "Information Technology", "Electronics", "Electrical", "Mechanical", "Civil"]},
                {"name": "Capgemini", "email": "hr@capgemini.com", "industry": "Technology Consulting", "website": "https://capgemini.com/careers", "hr": "Aiman E.", "title": "Senior Cloud Infrastructure Associate", "pkg": 7.5, "cgpa": 6.2, "branches": ["Computer Science", "Information Technology", "Electronics", "Electrical"]},
                {"name": "Cognizant", "email": "hr@cognizant.com", "industry": "Digital IT Services", "website": "https://cognizant.com/careers", "hr": "Ravi K.", "title": "Gen-C Next Software Engineer", "pkg": 6.75, "cgpa": 6.0, "branches": ["Computer Science", "Information Technology", "Electronics", "Electrical", "Mechanical"]},
                {"name": "Wipro", "email": "hr@wipro.com", "industry": "IT Solutions & Services", "website": "https://wipro.com/careers", "hr": "Thierry D.", "title": "Turbo Software Development Associate", "pkg": 6.5, "cgpa": 6.0, "branches": ["Computer Science", "Information Technology", "Electronics", "Electrical", "Mechanical", "Civil"]}
            ]

            for c_data in companies_data:
                comp = Company(
                    name=c_data["name"],
                    email=c_data["email"],
                    password_hash=default_pwd,
                    hr_contact=c_data["hr"],
                    website=c_data["website"],
                    industry=c_data["industry"],
                    description=f"Global leader in {c_data['industry']}. Committed to technical innovation, engineering excellence, and empowering the next generation of engineers.",
                    approval_status="approved",
                    is_active=True
                )
                db.session.add(comp)
                db.session.flush() # flush to generate ID for comp.id

                drive = PlacementDrive(
                    company_id=comp.id,
                    job_title=c_data["title"],
                    job_description=f"We are seeking motivated graduates to join our {c_data['industry']} division as a {c_data['title']}. Excellent coding, problem-solving, and communication skills required.",
                    eligibility_cgpa=c_data["cgpa"],
                    package_lpa=c_data["pkg"],
                    application_deadline=date.today() + timedelta(days=45),
                    status="approved",
                    eligible_branches=json.dumps(c_data["branches"])
                )
                db.session.add(drive)

            db.session.commit()
            print("Successfully seeded 16 world-class companies and active placement drives!")

    if app_context_open:
        _seed()
    else:
        app = create_app()
        with app.app_context():
            _seed()

if __name__ == '__main__':
    seed_database(app_context_open=False)
