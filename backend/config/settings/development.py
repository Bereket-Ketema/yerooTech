"""Development settings."""
from .base import *

DEBUG = True

ALLOWED_HOSTS = ['*']

# Use SQLite for development
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Disable throttling in development
REST_FRAMEWORK['DEFAULT_THROTTLE_CLASSES'] = []

# CORS - allow all in development
CORS_ALLOW_ALL_ORIGINS = True

# Email - console backend for development
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'

