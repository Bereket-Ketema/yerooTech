"""Attendance Group models."""
import uuid
from django.db import models
from apps.core.models import TenantOwnedModel
from apps.core.utils import generate_unique_code


class AttendanceGroup(TenantOwnedModel):
    """An attendance group (class, team, event, etc.)."""

    class Category(models.TextChoices):
        CLASS = 'class', 'Class'
        DEPARTMENT = 'department', 'Department'
        TEAM = 'team', 'Team'
        EVENT = 'event', 'Event'
        MEETING = 'meeting', 'Meeting'
        TRAINING = 'training', 'Training Program'
        WORKSHOP = 'workshop', 'Workshop'
        SEMINAR = 'seminar', 'Seminar'
        CONFERENCE = 'conference', 'Conference'
        OTHER = 'other', 'Other'

    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        ARCHIVED = 'archived', 'Archived'
        DRAFT = 'draft', 'Draft'

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.OTHER
    )
    unique_code = models.CharField(
        max_length=12, unique=True, editable=False
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE
    )
    registration_open = models.BooleanField(default=True)
    max_participants = models.IntegerField(null=True, blank=True)

    # Registration QR and invite link token
    invite_token = models.UUIDField(default=uuid.uuid4, unique=True)

    class Meta:
        db_table = 'attendance_groups'
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['owner', 'name'],
                name='unique_group_name_per_owner'
            )
        ]

    def __str__(self):
        return f'{self.name} ({self.unique_code})'

    def save(self, *args, **kwargs):
        if not self.unique_code:
            self.unique_code = generate_unique_code(8)
            while AttendanceGroup.objects.filter(unique_code=self.unique_code).exists():
                self.unique_code = generate_unique_code(8)
        super().save(*args, **kwargs)

    @property
    def participant_count(self):
        return self.memberships.filter(status='active').count()

    @property
    def session_count(self):
        return self.sessions.count()


class GroupMembership(models.Model):
    """Tracks participant membership in a group."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    group = models.ForeignKey(
        AttendanceGroup,
        on_delete=models.CASCADE,
        related_name='memberships'
    )
    participant = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='group_memberships'
    )
    status = models.CharField(
        max_length=20,
        choices=[
            ('active', 'Active'),
            ('removed', 'Removed'),
            ('left', 'Left'),
        ],
        default='active'
    )
    joined_at = models.DateTimeField(auto_now_add=True)
    joined_via = models.CharField(
        max_length=20,
        choices=[
            ('qr_code', 'QR Code'),
            ('invite_link', 'Invite Link'),
            ('manual', 'Manual'),
            ('direct', 'Direct'),
        ],
        default='direct'
    )

    class Meta:
        db_table = 'group_memberships'
        constraints = [
            models.UniqueConstraint(
                fields=['group', 'participant'],
                name='unique_membership'
            )
        ]
        ordering = ['-joined_at']

    def __str__(self):
        return f'{self.participant.full_name} in {self.group.name}'

