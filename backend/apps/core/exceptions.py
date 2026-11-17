"""Custom exception handler for the API."""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.db import DatabaseError


def custom_exception_handler(exc, context):
    """Custom exception handler that wraps errors in a consistent format."""
    response = exception_handler(exc, context)

    if response is not None:
        custom_data = {
            'success': False,
            'error': {
                'status_code': response.status_code,
                'detail': response.data,
            }
        }
        response.data = custom_data
        return response

    # Catch database connectivity or migration errors gracefully
    if isinstance(exc, DatabaseError):
        return Response({
            'success': False,
            'error': {
                'status_code': status.HTTP_503_SERVICE_UNAVAILABLE,
                'detail': f'Database error: {str(exc)}. If deploying on Vercel, attach a Postgres database or visit /api/v1/health/?secret=<KEY> to run migrations.',
            }
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    return None
