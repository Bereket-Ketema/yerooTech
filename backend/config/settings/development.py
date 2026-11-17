"""Development settings."""
import os
import shutil
import urllib.parse
from pathlib import Path
from .base import *

DEBUG = True

ALLOWED_HOSTS = ['*']

# Database configuration
is_serverless = os.environ.get('VERCEL') == '1' or os.environ.get('AWS_LAMBDA_FUNCTION_NAME') is not None
database_url = os.environ.get('DATABASE_URL') or os.environ.get('POSTGRES_URL')
db_host = os.environ.get('DB_HOST', '').strip()
db_engine = os.environ.get('DB_ENGINE', '')

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
elif db_host and db_host not in ('localhost', '127.0.0.1', '/tmp'):
    # Remote cloud host
    DATABASES = {
        'default': {
            'ENGINE': db_engine or 'django.db.backends.postgresql',
            'NAME': os.environ.get('DB_NAME', 'yerootech'),
            'USER': os.environ.get('DB_USER', 'postgres'),
            'PASSWORD': os.environ.get('DB_PASSWORD', ''),
            'HOST': db_host,
            'PORT': os.environ.get('DB_PORT', '5432'),
        }
    }
elif not is_serverless and db_engine and 'sqlite' not in db_engine:
    # Running locally with Postgres daemon
    if not db_host or db_host in ('localhost', '127.0.0.1'):
        if os.path.exists('/tmp/.s.PGSQL.5432'):
            db_host = '/tmp'
        else:
            db_host = 'localhost'

    DATABASES = {
        'default': {
            'ENGINE': db_engine,
            'NAME': os.environ.get('DB_NAME', 'yerootech'),
            'USER': os.environ.get('DB_USER', 'postgres'),
            'PASSWORD': os.environ.get('DB_PASSWORD', ''),
            'HOST': db_host,
            'PORT': os.environ.get('DB_PORT', '5432'),
        }
    }
else:
    # Serverless SQLite fallback with pre-seeded demo database
    tmp_db = Path('/tmp/yerootech_db.sqlite3')
    bundled_seed = BASE_DIR / 'seed_template.sqlite3'
    if not tmp_db.exists() and bundled_seed.exists() and os.path.exists('/tmp'):
        try:
            shutil.copy2(bundled_seed, tmp_db)
        except Exception:
            pass

    target_db = tmp_db if (is_serverless and os.path.exists('/tmp')) else (BASE_DIR / 'db.sqlite3')
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': target_db,
        }
    }

# Disable throttling in development
REST_FRAMEWORK['DEFAULT_THROTTLE_CLASSES'] = []

# CORS - allow all in development
CORS_ALLOW_ALL_ORIGINS = True

# Email - console backend for development
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'
