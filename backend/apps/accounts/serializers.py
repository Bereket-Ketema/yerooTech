"""Account serializers for registration, login, and profile management."""
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, OTPVerification
from django.utils import timezone
from datetime import timedelta
from apps.core.utils import generate_otp


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for attendance taker registration."""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name', 'phone_number',
            'password', 'confirm_password'
        ]

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone_number=validated_data.get('phone_number', ''),
            role=User.Role.ATTENDANCE_TAKER,
            account_status=User.AccountStatus.PENDING
        )
        return user


class ParticipantRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for participant registration."""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name', 'phone_number',
            'password', 'confirm_password'
        ]

    def validate_phone_number(self, value):
        if not value:
            raise serializers.ValidationError('Phone number is required for participants.')
        return value

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone_number=validated_data.get('phone_number', ''),
            role=User.Role.PARTICIPANT,
            account_status=User.AccountStatus.APPROVED  # Participants auto-approved
        )
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for login."""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(
            username=data['email'],
            password=data['password']
        )
        if not user:
            raise serializers.ValidationError('Invalid email or password.')
        if not user.is_active:
            raise serializers.ValidationError('Account is inactive.')
        data['user'] = user
        return data


class GoogleAuthSerializer(serializers.Serializer):
    """Serializer for Google OAuth authentication."""
    token = serializers.CharField()
    role = serializers.ChoiceField(
        choices=['attendance_taker', 'participant'],
        default='attendance_taker'
    )


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile."""
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone_number', 'role', 'account_status', 'avatar_url',
            'phone_verified', 'email_verified', 'date_joined'
        ]
        read_only_fields = ['id', 'email', 'role', 'account_status', 'date_joined']


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change."""
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value


class OTPRequestSerializer(serializers.Serializer):
    """Serializer for OTP request."""
    phone_number = serializers.CharField(max_length=20)


class OTPVerifySerializer(serializers.Serializer):
    """Serializer for OTP verification."""
    phone_number = serializers.CharField(max_length=20)
    otp_code = serializers.CharField(max_length=10)


def get_tokens_for_user(user):
    """Generate JWT tokens for a user."""
    refresh = RefreshToken.for_user(user)
    refresh['role'] = user.role
    refresh['account_status'] = user.account_status
    refresh['full_name'] = user.full_name
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

