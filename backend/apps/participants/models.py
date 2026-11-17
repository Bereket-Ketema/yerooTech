import uuid
from django.db import models
from apps.core.models import TimeStampedModel

class ParticipantProfile(TimeStampedModel):
    user = models.OneToOneField(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='participant_profile'
    )
    identifier = models.CharField(
        max_length=100,
        blank=True,
        default='',
        help_text='Student ID, Employee ID, or Badge Number'
    )
    department = models.CharField(max_length=150, blank=True, default='')
    organization_or_school = models.CharField(max_length=200, blank=True, default='')
    gender = models.CharField(
        max_length=20,
        choices=[
            ('male', 'Male'),
            ('female', 'Female'),
            ('other', 'Other'),
            ('prefer_not_to_say', 'Prefer not to say'),
        ],
        default='prefer_not_to_say'
    )
    # Architecture readiness for NFC
    nfc_card_uid = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        unique=True,
        help_text='NFC Card UID for physical contactless attendance (Future Expansion)'
    )
    notes = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'participant_profiles'

    def __str__(self):
        return f'{self.user.full_name} ({self.identifier or self.user.email})'

