import json
from datetime import datetime
from app import db

class ResumeAnalysis(db.Model):
    __tablename__ = 'resume_analysis'

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('student.id', ondelete='CASCADE'), unique=True, nullable=False)
    
    # Store complete resume text for reference
    text = db.Column(db.Text, nullable=True)

    # General Analysis Scores
    resume_score = db.Column(db.Integer, default=0)
    tech_skills_score = db.Column(db.Integer, default=0)
    communication_score = db.Column(db.Integer, default=0)
    education_score = db.Column(db.Integer, default=0)
    projects_score = db.Column(db.Integer, default=0)
    experience_score = db.Column(db.Integer, default=0)
    overall_rating = db.Column(db.String(50), nullable=True)

    # Lists stored as JSON strings
    missing_sections = db.Column(db.Text, nullable=True)
    weak_points = db.Column(db.Text, nullable=True)
    grammar_issues = db.Column(db.Text, nullable=True)
    formatting_problems = db.Column(db.Text, nullable=True)
    strengths = db.Column(db.Text, nullable=True)
    weaknesses = db.Column(db.Text, nullable=True)
    suggestions = db.Column(db.Text, nullable=True)
    improvement_tips = db.Column(db.Text, nullable=True)

    # ATS Scoring
    ats_score = db.Column(db.Integer, default=0)
    ats_headings_score = db.Column(db.Integer, default=0)
    ats_contact_score = db.Column(db.Integer, default=0)
    ats_keyword_score = db.Column(db.Integer, default=0)
    ats_overall_rating = db.Column(db.String(50), nullable=True)
    
    ats_suggestions = db.Column(db.Text, nullable=True)
    ats_missing_keywords = db.Column(db.Text, nullable=True)
    ats_formatting_issues = db.Column(db.Text, nullable=True)
    ats_weak_sections = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def __init__(self, student_id, text=None, resume_score=0, tech_skills_score=0, communication_score=0,
                 education_score=0, projects_score=0, experience_score=0, overall_rating=None,
                 missing_sections=None, weak_points=None, grammar_issues=None, formatting_problems=None,
                 strengths=None, weaknesses=None, suggestions=None, improvement_tips=None,
                 ats_score=0, ats_headings_score=0, ats_contact_score=0, ats_keyword_score=0,
                 ats_overall_rating=None, ats_suggestions=None, ats_missing_keywords=None,
                 ats_formatting_issues=None, ats_weak_sections=None):
        self.student_id = student_id
        self.text = text
        self.resume_score = resume_score
        self.tech_skills_score = tech_skills_score
        self.communication_score = communication_score
        self.education_score = education_score
        self.projects_score = projects_score
        self.experience_score = experience_score
        self.overall_rating = overall_rating
        
        self.missing_sections = json.dumps(missing_sections or [])
        self.weak_points = json.dumps(weak_points or [])
        self.grammar_issues = json.dumps(grammar_issues or [])
        self.formatting_problems = json.dumps(formatting_problems or [])
        self.strengths = json.dumps(strengths or [])
        self.weaknesses = json.dumps(weaknesses or [])
        self.suggestions = json.dumps(suggestions or [])
        self.improvement_tips = json.dumps(improvement_tips or [])
        
        self.ats_score = ats_score
        self.ats_headings_score = ats_headings_score
        self.ats_contact_score = ats_contact_score
        self.ats_keyword_score = ats_keyword_score
        self.ats_overall_rating = ats_overall_rating
        
        self.ats_suggestions = json.dumps(ats_suggestions or [])
        self.ats_missing_keywords = json.dumps(ats_missing_keywords or [])
        self.ats_formatting_issues = json.dumps(ats_formatting_issues or [])
        self.ats_weak_sections = json.dumps(ats_weak_sections or [])

    def get_list(self, field):
        val = getattr(self, field)
        if not val:
            return []
        try:
            return json.loads(val)
        except Exception:
            return []

    def set_list(self, field, lst):
        setattr(self, field, json.dumps(lst or []))

    def to_dict(self):
        return {
            "resume_score": self.resume_score,
            "tech_skills_score": self.tech_skills_score,
            "communication_score": self.communication_score,
            "education_score": self.education_score,
            "projects_score": self.projects_score,
            "experience_score": self.experience_score,
            "overall_rating": self.overall_rating,
            "missing_sections": self.get_list("missing_sections"),
            "weak_points": self.get_list("weak_points"),
            "grammar_issues": self.get_list("grammar_issues"),
            "formatting_problems": self.get_list("formatting_problems"),
            "strengths": self.get_list("strengths"),
            "weaknesses": self.get_list("weaknesses"),
            "suggestions": self.get_list("suggestions"),
            "improvement_tips": self.get_list("improvement_tips"),
            "ats_score": self.ats_score,
            "ats_headings_score": self.ats_headings_score,
            "ats_contact_score": self.ats_contact_score,
            "ats_keyword_score": self.ats_keyword_score,
            "ats_overall_rating": self.ats_overall_rating,
            "ats_suggestions": self.get_list("ats_suggestions"),
            "ats_missing_keywords": self.get_list("ats_missing_keywords"),
            "ats_formatting_issues": self.get_list("ats_formatting_issues"),
            "ats_weak_sections": self.get_list("ats_weak_sections"),
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
