import os
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import connection
from django.core.management import call_command


class HealthCheckView(APIView):
    """
    Public health check endpoint: /api/v1/health/
    Verifies database connectivity and allows 1-click migration via secret token.
    """
    permission_classes = []
    authentication_classes = []

    def get(self, request):
        db_status = "unknown"
        error_detail = None
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            db_status = "connected"
        except Exception as e:
            db_status = "disconnected"
            error_detail = str(e)

        # Allow authenticated 1-click migration and seeding via secret query parameter
        secret = request.query_params.get('secret')
        expected_secret = os.environ.get('DJANGO_SECRET_KEY')
        migration_output = None

        if secret and expected_secret and secret == expected_secret:
            try:
                call_command('migrate', interactive=False)
                call_command('seed_data')
                migration_output = "Migrations and seed data applied successfully."
            except Exception as e:
                migration_output = f"Migration failed: {str(e)}"

        return Response({
            "status": "healthy" if db_status == "connected" else "degraded",
            "database": {
                "status": db_status,
                "engine": connection.settings_dict.get('ENGINE', '').split('.')[-1],
                "name": connection.settings_dict.get('NAME', ''),
                "error": error_detail,
            },
            "migration_action": migration_output,
            "version": "1.0.0",
        })

