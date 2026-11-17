"""Development settings."""
import urllib.parse
from .base import *

DEBUG = True

ALLOWED_HOSTS = ['*']

# Database configuration (supports DATABASE_URL, SQLite, and PostgreSQL via .env)
database_url = os.environ.get('DATABASE_URL') or os.environ.get('POSTGRES_URL')
db_engine = os.environ.get('DB_ENGINE', 'django.db.backends.postgresql')

if database_url:
    url = urllib.parse.urlparse(database_url)
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': url.path[1:] if url.path.startswith('/') else url.path,
            'USER': url.username or '',
            'PASSWORD': url.password or '',
            'HOST': url.hostname or '',
            'PORT': str(url.port or 5432),
        }
    }
elif 'sqlite' in db_engine:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': db_engine,
            'NAME': os.environ.get('DB_NAME', 'yerootech'),
            'USER': os.environ.get('DB_USER', 'postgres'),
            'PASSWORD': os.environ.get('DB_PASSWORD', ''),
            'HOST': os.environ.get('DB_HOST', '/tmp'),
            'PORT': os.environ.get('DB_PORT', '5432'),
        }
    }

# Disable throttling in development
REST_FRAMEWORK['DEFAULT_THROTTLE_CLASSES'] = []

# CORS - allow all in development
CORS_ALLOW_ALL_ORIGINS = True

# Email - console backend for development
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'
