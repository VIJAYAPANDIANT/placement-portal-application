import os
from datetime import timedelta

# Get absolute path to the backend directory for local SQLite database storage
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# Load local .env file variables into environment if present
_env_path = os.path.join(BASE_DIR, '.env')
if os.path.exists(_env_path):
    with open(_env_path, 'r') as f:
        for line in f:
            stripped = line.strip()
            if stripped and '=' in stripped and not stripped.startswith('#'):
                k, v = stripped.split('=', 1)
                os.environ[k.strip()] = v.strip()

class Config:
    # For Vercel / serverless environment, fallback to /tmp/app.db.
    # Otherwise, use the standard Flask instance folder database path.
    if os.environ.get('VERCEL') or os.environ.get('DATABASE_URL'):
        SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:////tmp/app.db')
    else:
        _base_dir = os.path.abspath(os.path.dirname(__file__))
        _db_path = os.path.join(_base_dir, 'app.db')
        if not os.path.exists(_db_path):
            os.makedirs(os.path.join(_base_dir, 'instance'), exist_ok=True)
            _db_path = os.path.join(_base_dir, 'instance', 'app.db')
        SQLALCHEMY_DATABASE_URI = 'sqlite:///' + _db_path
    
    # Disables Flask-SQLAlchemy's event system, which tracks modifications of objects. 
    # Setting it to False avoids overhead and improves performance, as we don't need this custom tracking.
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # The secret key used by Flask-JWT-Extended to sign and encode JWT tokens.
    # In a production environment, this should be a secure, random string loaded from environment variables.
    JWT_SECRET_KEY = 'super-secret-key-change-in-production'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=30)

    # Redis config (broker and result backend)
    CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')
    CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
    CELERY_BROKER_TRANSPORT_OPTIONS = {'protocol': 2}
    CELERY_RESULT_BACKEND_TRANSPORT_OPTIONS = {'protocol': 2}


    # Flask-Mail config (Gmail SMTP by default. Set real credentials below or via environment variables)
    MAIL_SERVER = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.environ.get('MAIL_PORT', 465))
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'False').lower() == 'true'
    MAIL_USE_SSL = os.environ.get('MAIL_USE_SSL', 'True').lower() == 'true'
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME', 'vigneshwaran7002@gmail.com') # Let's set it to user's email as default sender
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD', 'lfwk jvmw ozok svkn')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER', 'vigneshwaran7002@gmail.com')

    # Flask-Caching config
    CACHE_TYPE = os.environ.get('CACHE_TYPE', 'SimpleCache')
    CACHE_REDIS_URL = os.environ.get('CACHE_REDIS_URL', 'redis://localhost:6379/0')
    CACHE_DEFAULT_TIMEOUT = 300

    # Groq API Key config
    GROQ_API_KEY = os.environ.get('GROQ_API_KEY')

