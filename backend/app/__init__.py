import os
from flask import Flask, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_mail import Mail
from flask_caching import Cache
from celery import Celery

# Globally instantiate database and JWT extensions.
db = SQLAlchemy()
jwt = JWTManager()
mail = Mail()
cache = Cache()

def make_celery(app):
    celery = Celery(
        app.import_name,
        broker=app.config['CELERY_BROKER_URL'],
        backend=app.config['CELERY_RESULT_BACKEND']
    )
    celery.conf.update(app.config)

    class ContextTask(celery.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)

    celery.Task = ContextTask
    return celery

def create_app(config_class='config.Config'):
    """
    Flask App Factory.
    Creates, configures, and returns a Flask application instance.
    """
    app = Flask(__name__)
    CORS(app)
    
    # Load settings from config.py's Config class
    app.config.from_object(config_class)
    
    # Bind extensions to the current app instance
    db.init_app(app)
    jwt.init_app(app)
    mail.init_app(app)
    cache.init_app(app)
    
    celery = make_celery(app)
    app.celery = celery
    
    # Import and register blueprints
    from app.routes.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    
    from app.routes.admin import admin_bp
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    
    from app.routes.company import company_bp
    app.register_blueprint(company_bp, url_prefix='/api/company')

    from app.routes.student import student_bp
    app.register_blueprint(student_bp, url_prefix='/api/student')
    
    @app.route('/')
    def index():
        return jsonify({
            "status": "online",
            "message": "Placement Portal backend API is active."
        }), 200

    @app.route('/uploads/<path:filename>')
    def serve_upload(filename):
        import tempfile
        upload_folder = os.path.join(tempfile.gettempdir(), 'uploads')
        return send_from_directory(upload_folder, filename)
    
    with app.app_context():
        from app import models
        db.create_all()
        
        # Programmatically seed superuser Admin account and 16+ realistic tech companies & placement drives
        try:
            import sys
            base_backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            if base_backend_dir not in sys.path:
                sys.path.insert(0, base_backend_dir)
            from seed import seed_database
            seed_database(app_context_open=True)
        except Exception as e:
            print("Automatic seeding log:", e)

    return app
