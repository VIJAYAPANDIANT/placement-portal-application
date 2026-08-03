import os
# Globally monkeypatch redis-py to default to RESP2 (protocol=2) and disable maintenance notifications.
# This ensures compatibility with older Redis versions (like Redis 5.x on Windows) without breaking.
try:
    import redis.connection
    import redis.maint_notifications
    redis.connection.DEFAULT_RESP_VERSION = 2
    redis.maint_notifications.MaintNotificationsConfig.__init__.__defaults__ = (False, True, 10, None)
except ImportError:
    pass

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
    
    # Filter and convert Flask's Celery configurations to lowercase to prevent mixing key styles
    celery_config = {}
    for key, value in app.config.items():
        if key.startswith('CELERY_'):
            # Convert CELERY_BROKER_URL -> broker_url, CELERY_RESULT_BACKEND -> result_backend
            # and other settings to lowercase without the 'CELERY_' prefix if needed.
            if key == 'CELERY_BROKER_URL':
                new_key = 'broker_url'
            elif key == 'CELERY_RESULT_BACKEND':
                new_key = 'result_backend'
            else:
                new_key = key[7:].lower()
            celery_config[new_key] = value
            
    celery.conf.update(celery_config)

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
        # Safely migrate notifications table in development if columns are missing
        try:
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            if 'notifications' in inspector.get_table_names():
                columns = [col['name'] for col in inspector.get_columns('notifications')]
                if 'user_id' not in columns:
                    print("Migrating notifications table...")
                    db.metadata.drop_all(bind=db.engine, tables=[models.Notification.__table__])
        except Exception as e:
            print("Migration warning:", e)

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
