"""Account views for authentication, registration, and profile management."""
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import requests

from .models import User, OTPVerification
from .serializers import (
    UserRegistrationSerializer,
    ParticipantRegistrationSerializer,
    LoginSerializer,
    GoogleAuthSerializer,
    UserProfileSerializer,
    ChangePasswordSerializer,
    OTPRequestSerializer,
    OTPVerifySerializer,
    get_tokens_for_user,
)
from apps.core.utils import generate_otp


class RegisterAttendanceTakerView(generics.CreateAPIView):
    """Register a new attendance taker. Account starts as PENDING."""
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        tokens = get_tokens_for_user(user)
        return Response({
            'success': True,
            'message': 'Registration successful. Your account is pending admin approval.',
            'data': {
                'user': UserProfileSerializer(user).data,
                'tokens': tokens,
            }
        }, status=status.HTTP_201_CREATED)


class RegisterParticipantView(generics.CreateAPIView):
    """Register a new participant. Auto-approved."""
    serializer_class = ParticipantRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        tokens = get_tokens_for_user(user)
        return Response({
            'success': True,
            'message': 'Registration successful.',
            'data': {
                'user': UserProfileSerializer(user).data,
                'tokens': tokens,
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """Login with email and password."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        tokens = get_tokens_for_user(user)
        return Response({
            'success': True,
            'message': 'Login successful.',
            'data': {
                'user': UserProfileSerializer(user).data,
                'tokens': tokens,
            }
        })


class GoogleAuthView(APIView):
    """Authenticate with Google OAuth."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data['token']
        requested_role = serializer.validated_data['role']

        # Verify Google token
        try:
            google_resp = requests.get(
                'https://www.googleapis.com/oauth2/v3/userinfo',
                headers={'Authorization': f'Bearer {token}'},
                timeout=10
            )
            if google_resp.status_code != 200:
                return Response({
                    'success': False,
                    'message': 'Invalid Google token.'
                }, status=status.HTTP_400_BAD_REQUEST)

            google_data = google_resp.json()
        except requests.RequestException:
            return Response({
                'success': False,
                'message': 'Could not verify Google token.'
            }, status=status.HTTP_400_BAD_REQUEST)

        google_id = google_data.get('sub')
        email = google_data.get('email')
        first_name = google_data.get('given_name', '')
        last_name = google_data.get('family_name', '')
        avatar = google_data.get('picture', '')

        if not email:
            return Response({
                'success': False,
                'message': 'Email not available from Google account.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check existing user
        user = User.objects.filter(google_id=google_id).first()
        if not user:
            user = User.objects.filter(email=email).first()

        if user:
            # Update Google info
            if not user.google_id:
                user.google_id = google_id
            user.avatar_url = avatar
            user.email_verified = True
            user.save()
        else:
            # Create new user
            account_status = (
                User.AccountStatus.PENDING
                if requested_role == 'attendance_taker'
                else User.AccountStatus.APPROVED
            )
            user = User.objects.create(
                email=email,
                google_id=google_id,
                first_name=first_name,
                last_name=last_name,
                avatar_url=avatar,
                role=requested_role,
                account_status=account_status,
                email_verified=True,
            )
            user.set_unusable_password()
            user.save()

        tokens = get_tokens_for_user(user)
        is_new = user.date_joined >= timezone.now() - timedelta(seconds=5)

        return Response({
            'success': True,
            'message': 'Google authentication successful.',
            'data': {
                'user': UserProfileSerializer(user).data,
                'tokens': tokens,
                'is_new_user': is_new,
            }
        })


class LogoutView(APIView):
    """Logout by blacklisting the refresh token."""
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({
                'success': True,
                'message': 'Logged out successfully.'
            })
        except Exception:
            return Response({
                'success': True,
                'message': 'Logged out.'
            })


class ProfileView(generics.RetrieveUpdateAPIView):
    """Get or update user profile."""
    serializer_class = UserProfileSerializer

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
        serializer = self.get_serializer(
            self.get_object(), data=request.data, partial=partial
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'success': True,
            'data': serializer.data
        })


class ChangePasswordView(APIView):
    """Change password for authenticated user."""
    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({
            'success': True,
            'message': 'Password changed successfully.'
        })


class RequestOTPView(APIView):
    """Request an OTP for phone verification."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = OTPRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data['phone_number']

        # Invalidate old OTPs
        OTPVerification.objects.filter(
            phone_number=phone, is_used=False
        ).update(is_used=True)

        otp = generate_otp(settings.OTP_LENGTH)
        OTPVerification.objects.create(
            phone_number=phone,
            otp_code=otp,
            expires_at=timezone.now() + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)
        )

        # In production, send via SMS provider. For dev, return in response.
        response_data = {
            'success': True,
            'message': 'OTP sent successfully.',
        }
        if settings.DEBUG:
            response_data['debug_otp'] = otp

        return Response(response_data)


class VerifyOTPView(APIView):
    """Verify OTP for phone verification."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        phone = serializer.validated_data['phone_number']
        code = serializer.validated_data['otp_code']

        otp_record = OTPVerification.objects.filter(
            phone_number=phone,
            is_used=False
        ).order_by('-created_at').first()

        if not otp_record or not otp_record.is_valid():
            return Response({
                'success': False,
                'message': 'OTP expired or invalid. Please request a new one.'
            }, status=status.HTTP_400_BAD_REQUEST)

        otp_record.attempts += 1
        otp_record.save()

        if otp_record.otp_code != code:
            return Response({
                'success': False,
                'message': 'Invalid OTP code.',
                'attempts_remaining': 3 - otp_record.attempts
            }, status=status.HTTP_400_BAD_REQUEST)

        otp_record.is_used = True
        otp_record.save()

        # Mark user phone as verified if logged in
        if request.user.is_authenticated:
            request.user.phone_verified = True
            request.user.phone_number = phone
            request.user.save()

        # Also check for user with this phone
        user = User.objects.filter(phone_number=phone).first()
        if user:
            user.phone_verified = True
            user.save()

        return Response({
            'success': True,
            'message': 'Phone number verified successfully.'
        })

