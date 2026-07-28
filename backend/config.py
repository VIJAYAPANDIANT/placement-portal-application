import os

# Get absolute path to the backend directory for local SQLite database storage
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
    # For Vercel / serverless environment, fallback to /tmp/app.db.
    # Otherwise, use the standard Flask instance folder database path.
    if os.environ.get('VERCEL') or os.environ.get('DATABASE_URL'):
        SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:////tmp/app.db')
    else:
        _base_dir = os.path.abspath(os.path.dirname(__file__))
        SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(_base_dir, 'instance', 'app.db')
    
    # Disables Flask-SQLAlchemy's event system, which tracks modifications of objects. 
    # Setting it to False avoids overhead and improves performance, as we don't need this custom tracking.
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # The secret key used by Flask-JWT-Extended to sign and encode JWT tokens.
    # In a production environment, this should be a secure, random string loaded from environment variables.
    JWT_SECRET_KEY = 'super-secret-key-change-in-production'

    # Redis config (broker and result backend)
    CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')
    CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
    CELERY_BROKER_TRANSPORT_OPTIONS = {'protocol': 2}
    CELERY_RESULT_BACKEND_TRANSPORT_OPTIONS = {'protocol': 2}


    # Flask-Mail config (use Gmail SMTP for simplicity)
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = 'your-email@gmail.com'
    MAIL_PASSWORD = 'your-app-password'
    MAIL_DEFAULT_SENDER = 'your-email@gmail.com'

    # Flask-Caching config
    CACHE_TYPE = os.environ.get('CACHE_TYPE', 'SimpleCache')
    CACHE_REDIS_URL = os.environ.get('CACHE_REDIS_URL', 'redis://localhost:6379/0')
    CACHE_DEFAULT_TIMEOUT = 300

