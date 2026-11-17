"""Production settings for Vercel / Cloud deployments."""
import os
import shutil
import urllib.parse
from pathlib import Path
from .base import *

DEBUG = os.environ.get('DEBUG', 'False').lower() in ('true', '1')

ALLOWED_HOSTS = [
    h.strip()
    for h in os.environ.get('ALLOWED_HOSTS', '*').split(',')
    if h.strip()
]

# Guarantee Vercel domains, localhost, and wildcard are always permitted
for default_h in ['.vercel.app', 'yerootech.vercel.app', 'localhost', '127.0.0.1', '*']:
    if default_h not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(default_h)

CSRF_TRUSTED_ORIGINS = [
    'https://*.vercel.app',
    'https://yerootech.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
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
# 1. Cloud PostgreSQL (Neon / Supabase / Vercel Postgres via DATABASE_URL or POSTGRES_URL)
# 2. Remote PostgreSQL host (DB_HOST != localhost)
# 3. Serverless fallback: Writable SQLite in /tmp seeded with initial accounts
# 4. Local machine: Local PostgreSQL or SQLite

is_serverless = os.environ.get('VERCEL') == '1' or os.environ.get('AWS_LAMBDA_FUNCTION_NAME') is not None
database_url = os.environ.get('DATABASE_URL') or os.environ.get('POSTGRES_URL')
db_host = os.environ.get('DB_HOST', '').strip()

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
elif db_host and db_host not in ('localhost', '127.0.0.1', '/tmp'):
    # Remote cloud host
    DATABASES = {
        'default': {
            'ENGINE': os.environ.get('DB_ENGINE', 'django.db.backends.postgresql'),
            'NAME': os.environ.get('DB_NAME', 'yerootech'),
            'USER': os.environ.get('DB_USER', 'postgres'),
            'PASSWORD': os.environ.get('DB_PASSWORD', ''),
            'HOST': db_host,
            'PORT': os.environ.get('DB_PORT', '5432'),
            'CONN_MAX_AGE': 600,
        }
    }
elif not is_serverless and os.environ.get('DB_ENGINE') and 'sqlite' not in os.environ.get('DB_ENGINE', ''):
    # Local server / container with local Postgres daemon
    DATABASES = {
        'default': {
            'ENGINE': os.environ.get('DB_ENGINE', 'django.db.backends.postgresql'),
            'NAME': os.environ.get('DB_NAME', 'yerootech'),
            'USER': os.environ.get('DB_USER', 'postgres'),
            'PASSWORD': os.environ.get('DB_PASSWORD', ''),
            'HOST': db_host or 'localhost',
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
