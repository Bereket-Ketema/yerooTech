"""Custom exception handler for the API."""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


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

