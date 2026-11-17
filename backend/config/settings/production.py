"""Production settings for Vercel / Cloud deployments."""
import os
import shutil
import urllib.parse
from pathlib import Path
from .base import *

DEBUG = os.environ.get('DEBUG', 'False').lower() in ('true', '1')

ALLOWED_HOSTS = [
    h.strip()
    for h in os.environ.get(
        'ALLOWED_HOSTS',
        '*'
    ).split(',')
    if h.strip()
]

# Security headers (only enforced when not running in debug)
if not DEBUG:
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# Database Configuration
database_url = os.environ.get('DATABASE_URL') or os.environ.get('POSTGRES_URL')

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
            'CONN_MAX_AGE': 600,
        }
    }
elif os.environ.get('DB_ENGINE') and 'sqlite' not in os.environ.get('DB_ENGINE', ''):
    DATABASES = {
        'default': {
            'ENGINE': os.environ.get('DB_ENGINE', 'django.db.backends.postgresql'),
            'NAME': os.environ.get('DB_NAME', 'yerootech'),
            'USER': os.environ.get('DB_USER', 'postgres'),
            'PASSWORD': os.environ.get('DB_PASSWORD', ''),
            'HOST': os.environ.get('DB_HOST', 'localhost'),
            'PORT': os.environ.get('DB_PORT', '5432'),
            'CONN_MAX_AGE': 600,
        }
    }
else:
    # Serverless SQLite fallback with pre-seeded demo database
    # In Vercel serverless / AWS Lambda, /tmp is the only writable directory.
    tmp_db = Path('/tmp/yerootech_db.sqlite3')
    bundled_seed = BASE_DIR / 'seed_template.sqlite3'
    if not tmp_db.exists() and bundled_seed.exists():
        try:
            shutil.copy2(bundled_seed, tmp_db)
        except Exception:
            pass

    target_db = tmp_db if os.path.exists('/tmp') else BASE_DIR / 'db.sqlite3'
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': target_db,
        }
    }
