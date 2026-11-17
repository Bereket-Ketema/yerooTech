"""Utility functions shared across the platform."""
import random
import string
import math
import qrcode
import io
import base64
from django.utils import timezone


def generate_unique_code(length=8):
    """Generate a random alphanumeric code."""
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choices(chars, k=length))


def generate_pin_code(length=6):
    """Generate a numeric PIN code."""
    return ''.join(random.choices(string.digits, k=length))


def generate_otp(length=6):
    """Generate a numeric OTP."""
    return ''.join(random.choices(string.digits, k=length))


def calculate_distance_meters(lat1, lon1, lat2, lon2):
    """
    Calculate distance between two GPS coordinates using Haversine formula.
    Returns distance in meters.
    """
    R = 6371000  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2) ** 2 +
         math.cos(phi1) * math.cos(phi2) *
         math.sin(delta_lambda / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


def generate_qr_code_base64(data: str) -> str:
    """Generate a QR code and return as base64 encoded string."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    return base64.b64encode(buffer.getvalue()).decode('utf-8')


def is_within_time_window(start_time, end_time):
    """Check if current time is within the given window."""
    now = timezone.now()
    if start_time and now < start_time:
        return False
    if end_time and now > end_time:
        return False
    return True

