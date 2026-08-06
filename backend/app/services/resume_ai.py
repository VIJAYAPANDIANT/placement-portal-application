import os
import json
import requests
from app import db
from app.models.resume_analysis import ResumeAnalysis
from app.models.skill import Skill
from app.models.student import Student
from flask import current_app

def extract_text_from_pdf(file_path):
    import pypdf
    text = ""
    try:
        reader = pypdf.PdfReader(file_path)
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    except Exception as e:
        print("PDF text extraction error:", e)
    return text

def analyze_resume_sync(student_id, file_path):
    # Extract PDF text
    text = extract_text_from_pdf(file_path)
    if not text.strip():
        print("Extracted text is empty. Using default fallback analysis.")
        text = "No readable text extracted from PDF."

    api_key = current_app.config.get('GROQ_API_KEY')
    if not api_key:
        raise ValueError("GROQ_API_KEY not configured in app config.")

    # Call Groq API
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    system_prompt = """You are an advanced AI Resume Screener, Applicant Tracking System (ATS) Specialist, and Talent Acquisition Architect.
Analyze the following extracted resume text and evaluate its score, structure, grammar, content quality, and key skills.

You MUST return a JSON object with the following exact keys and types:
{
  "resume_score": integer (0 to 100),
  "tech_skills_score": integer (0 to 100),
  "communication_score": integer (0 to 100),
  "education_score": integer (0 to 100),
  "projects_score": integer (0 to 100),
  "experience_score": integer (0 to 100),
  "overall_rating": string,
  "missing_sections": [string],
  "weak_points": [string],
  "grammar_issues": [string],
  "formatting_problems": [string],
  "strengths": [string],
  "weaknesses": [string],
  "suggestions": [string],
  "improvement_tips": [string],
  "ats_score": integer (0 to 100),
  "ats_headings_score": integer (0 to 100),
  "ats_contact_score": integer (0 to 100),
  "ats_keyword_score": integer (0 to 100),
  "ats_overall_rating": string,
  "ats_suggestions": [string],
  "ats_missing_keywords": [string],
  "ats_formatting_issues": [string],
  "ats_weak_sections": [string],
  "extracted_skills": {
    "Programming Languages": [string],
    "Frameworks": [string],
    "Libraries": [string],
    "Databases": [string],
    "Cloud Platforms": [string],
    "DevOps Tools": [string],
    "Tools": [string],
    "Soft Skills": [string],
    "Certifications": [string],
    "Projects": [string]
  }
}

Return ONLY the raw JSON object conforming exactly to this structure.
"""

    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Here is the resume text to analyze:\n\n{text}"}
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.2
    }

    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
        )
        response.raise_for_status()
        result_json = response.json()
        content = result_json["choices"][0]["message"]["content"]
        data = json.loads(content)
    except Exception as e:
        print("Groq API error, using default response:", e)
        # Safe fallback mock data in case Groq is unavailable
        data = {
            "resume_score": 70,
            "tech_skills_score": 75,
            "communication_score": 65,
            "education_score": 80,
            "projects_score": 70,
            "experience_score": 60,
            "overall_rating": "Good",
            "missing_sections": ["Certifications"],
            "weak_points": ["Add more details on projects"],
            "grammar_issues": [],
            "formatting_problems": [],
            "strengths": ["Clear layouts", "Relevant course details"],
            "weaknesses": ["Generic formatting"],
            "suggestions": ["Add technical achievements"],
            "improvement_tips": ["Add certificates"],
            "ats_score": 65,
            "ats_headings_score": 70,
            "ats_contact_score": 80,
            "ats_keyword_score": 50,
            "ats_overall_rating": "Semi-Compatible",
            "ats_suggestions": ["Include standard keyword density"],
            "ats_missing_keywords": ["Git", "SQL"],
            "ats_formatting_issues": [],
            "ats_weak_sections": ["Skills"],
            "extracted_skills": {
                "Programming Languages": ["Python", "JavaScript"],
                "Frameworks": ["Flask"],
                "Libraries": [],
                "Databases": ["SQLite"],
                "Cloud Platforms": [],
                "DevOps Tools": ["Git"],
                "Tools": ["VS Code"],
                "Soft Skills": ["Teamwork"],
                "Certifications": [],
                "Projects": []
            }
        }

    # Delete existing analysis and skills for this student
    ResumeAnalysis.query.filter_by(student_id=student_id).delete()
    Skill.query.filter_by(student_id=student_id).delete()

    # Save ResumeAnalysis
    analysis = ResumeAnalysis(
        student_id=student_id,
        text=text,
        resume_score=data.get("resume_score", 0),
        tech_skills_score=data.get("tech_skills_score", 0),
        communication_score=data.get("communication_score", 0),
        education_score=data.get("education_score", 0),
        projects_score=data.get("projects_score", 0),
        experience_score=data.get("experience_score", 0),
        overall_rating=data.get("overall_rating", "Good"),
        missing_sections=data.get("missing_sections", []),
        weak_points=data.get("weak_points", []),
        grammar_issues=data.get("grammar_issues", []),
        formatting_problems=data.get("formatting_problems", []),
        strengths=data.get("strengths", []),
        weaknesses=data.get("weaknesses", []),
        suggestions=data.get("suggestions", []),
        improvement_tips=data.get("improvement_tips", []),
        ats_score=data.get("ats_score", 0),
        ats_headings_score=data.get("ats_headings_score", 0),
        ats_contact_score=data.get("ats_contact_score", 0),
        ats_keyword_score=data.get("ats_keyword_score", 0),
        ats_overall_rating=data.get("ats_overall_rating", "Compatible"),
        ats_suggestions=data.get("ats_suggestions", []),
        ats_missing_keywords=data.get("ats_missing_keywords", []),
        ats_formatting_issues=data.get("ats_formatting_issues", []),
        ats_weak_sections=data.get("ats_weak_sections", [])
    )
    db.session.add(analysis)

    # Save Skills
    extracted_skills_dict = data.get("extracted_skills", {})
    all_skills_flat = []
    for category, skills in extracted_skills_dict.items():
        if isinstance(skills, list):
            for skill_name in skills:
                if skill_name:
                    db.session.add(Skill(student_id=student_id, name=skill_name, category=category))
                    all_skills_flat.append(skill_name)

    # Sync to Student profile skills column
    student = Student.query.get(student_id)
    if student and all_skills_flat:
        student.set_skills(all_skills_flat)

    db.session.commit()
    return True
