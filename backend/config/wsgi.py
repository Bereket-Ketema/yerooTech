import os
from django.core.wsgi import get_wsgi_application

# Default to production settings on Vercel / serverless deployments
default_settings = 'config.settings.production' if os.environ.get('VERCEL') == '1' else 'config.settings.development'
os.environ.setdefault('DJANGO_SETTINGS_MODULE', default_settings)

application = get_wsgi_application()
app = application  # Alias for serverless runtimes
