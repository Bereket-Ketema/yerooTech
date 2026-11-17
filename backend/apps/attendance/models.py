"""Attendance session and record models."""
import uuid
from django.db import models
from django.utils import timezone
from apps.core.models import TenantOwnedModel, TimeStampedModel
from apps.core.utils import generate_unique_code, generate_pin_code


class AttendanceSession(TenantOwnedModel):
    """An attendance session under a group."""

    class Method(models.TextChoices):
        QR_CODE = 'qr_code', 'QR Code'
        GPS = 'gps', 'GPS Location'
        MANUAL = 'manual', 'Manual'
        PIN = 'pin', 'PIN Code'
        NFC = 'nfc', 'NFC (Future)'

    class Status(models.TextChoices):
        SCHEDULED = 'scheduled', 'Scheduled'
        ACTIVE = 'active', 'Active'
        PAUSED = 'paused', 'Paused'
        CLOSED = 'closed', 'Closed'
        CANCELLED = 'cancelled', 'Cancelled'

    group = models.ForeignKey(
        'groups.AttendanceGroup',
        on_delete=models.CASCADE,
        related_name='sessions'
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    session_date = models.DateField(default=timezone.now)
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    attendance_method = models.CharField(
        max_length=20,
        choices=Method.choices,
        default=Method.QR_CODE
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.SCHEDULED
    )

    # QR Code fields
    qr_token = models.UUIDField(default=uuid.uuid4, unique=True)
    qr_expires_at = models.DateTimeField(null=True, blank=True)

    # GPS fields
    gps_latitude = models.FloatField(null=True, blank=True)
    gps_longitude = models.FloatField(null=True, blank=True)
    gps_radius_meters = models.IntegerField(default=100)

    # PIN fields
    pin_code = models.CharField(max_length=10, blank=True, default='')
    pin_expires_at = models.DateTimeField(null=True, blank=True)

    # Late threshold (minutes after start)
    late_threshold_minutes = models.IntegerField(default=15)

    # Allow combined methods
    allow_gps_verification = models.BooleanField(default=False)

    class Meta:
        db_table = 'attendance_sessions'
        ordering = ['-session_date', '-created_at']

    def __str__(self):
        return f'{self.title} - {self.group.name} ({self.session_date})'

    def save(self, *args, **kwargs):
        if self.attendance_method == self.Method.PIN and not self.pin_code:
            self.pin_code = generate_pin_code(6)
        super().save(*args, **kwargs)

    @property
    def is_active(self):
        return self.status == self.Status.ACTIVE

    @property
    def total_records(self):
        return self.records.count()

    @property
    def present_count(self):
        return self.records.filter(status='present').count()

    @property
    def absent_count(self):
        total_members = self.group.memberships.filter(status='active').count()
        return total_members - self.records.exclude(status='absent').count()

    @property
    def late_count(self):
        return self.records.filter(status='late').count()


class AttendanceRecord(TimeStampedModel):
    """Individual attendance record for a participant in a session."""

    class AttendanceStatus(models.TextChoices):
        PRESENT = 'present', 'Present'
        ABSENT = 'absent', 'Absent'
        LATE = 'late', 'Late'
        EXCUSED = 'excused', 'Excused'

    session = models.ForeignKey(
        AttendanceSession,
        on_delete=models.CASCADE,
        related_name='records'
    )
    participant = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='attendance_records'
    )
    status = models.CharField(
        max_length=20,
        choices=AttendanceStatus.choices,
        default=AttendanceStatus.PRESENT
    )
    recorded_at = models.DateTimeField(auto_now_add=True)
    method_used = models.CharField(
        max_length=20,
        choices=AttendanceSession.Method.choices,
        default=AttendanceSession.Method.MANUAL
    )

    # GPS coordinates of participant (if GPS method used)
    participant_latitude = models.FloatField(null=True, blank=True)
    participant_longitude = models.FloatField(null=True, blank=True)
    gps_distance_meters = models.FloatField(null=True, blank=True)

    # Audit trail
    modified_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='records_modified'
    )
    modification_reason = models.TextField(blank=True, default='')
    is_manually_modified = models.BooleanField(default=False)

    class Meta:
        db_table = 'attendance_records'
        constraints = [
            models.UniqueConstraint(
                fields=['session', 'participant'],
                name='unique_attendance_per_session'
            )
        ]
        ordering = ['-recorded_at']

    def __str__(self):
        return f'{self.participant.full_name} - {self.status} ({self.session.title})'


class AttendanceAuditLog(models.Model):
    """Audit log for attendance record changes."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    record = models.ForeignKey(
        AttendanceRecord,
        on_delete=models.CASCADE,
        related_name='audit_logs'
    )
    changed_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True
    )
    old_status = models.CharField(max_length=20)
    new_status = models.CharField(max_length=20)
    reason = models.TextField(blank=True, default='')
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'attendance_audit_logs'
        ordering = ['-changed_at']

