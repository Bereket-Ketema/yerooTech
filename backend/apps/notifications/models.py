import uuid
from django.db import models
from apps.core.models import TimeStampedModel

class Notification(TimeStampedModel):
    class NotificationType(models.TextChoices):
        ACCOUNT_STATUS = 'account_status', 'Account Status'
        SESSION_START = 'session_start', 'Session Started'
        ATTENDANCE_CONFIRM = 'attendance_confirm', 'Attendance Confirmation'
        GROUP_INVITE = 'group_invite', 'Group Invitation'
        SYSTEM = 'system', 'System Alert'

    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(
        max_length=30,
        choices=NotificationType.choices,
        default=NotificationType.SYSTEM
    )
    is_read = models.BooleanField(default=False)
    action_url = models.CharField(max_length=500, blank=True, default='')

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.title}"

