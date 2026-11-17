"""Custom User model with roles and account status management."""
import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    """Custom user manager."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'platform_admin')
        extra_fields.setdefault('account_status', 'approved')
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model supporting multiple roles and account statuses."""

    class Role(models.TextChoices):
        PLATFORM_ADMIN = 'platform_admin', 'Platform Administrator'
        ATTENDANCE_TAKER = 'attendance_taker', 'Attendance Taker'
        PARTICIPANT = 'participant', 'Participant'

    class AccountStatus(models.TextChoices):
        PENDING = 'pending', 'Pending Approval'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'
        SUSPENDED = 'suspended', 'Suspended'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.ATTENDANCE_TAKER
    )
    account_status = models.CharField(
        max_length=20,
        choices=AccountStatus.choices,
        default=AccountStatus.PENDING
    )

    # Google OAuth
    google_id = models.CharField(max_length=255, blank=True, null=True, unique=True)
    avatar_url = models.URLField(blank=True, null=True)

    # Phone verification
    phone_verified = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        db_table = 'users'
        ordering = ['-date_joined']

    def __str__(self):
        return f'{self.first_name} {self.last_name} ({self.email})'

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'.strip()

    @property
    def is_approved(self):
        return self.account_status == self.AccountStatus.APPROVED

    @property
    def is_pending(self):
        return self.account_status == self.AccountStatus.PENDING


class OTPVerification(models.Model):
    """OTP verification for phone numbers."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone_number = models.CharField(max_length=20)
    otp_code = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    attempts = models.IntegerField(default=0)

    class Meta:
        db_table = 'otp_verifications'
        ordering = ['-created_at']

    def is_valid(self):
        return (
            not self.is_used
            and self.attempts < 3
            and timezone.now() < self.expires_at
        )

