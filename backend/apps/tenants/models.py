"""Tenant models. Each attendance taker is an independent tenant."""
from apps.core.models import TimeStampedModel
from django.db import models


class TenantProfile(TimeStampedModel):
    """Extended profile for attendance takers acting as tenants."""
    user = models.OneToOneField(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='tenant_profile'
    )
    organization_name = models.CharField(max_length=255, blank=True, default='')
    organization_type = models.CharField(
        max_length=50,
        choices=[
            ('school', 'School'),
            ('university', 'University'),
            ('company', 'Company'),
            ('training_center', 'Training Center'),
            ('other', 'Other'),
        ],
        default='other'
    )
    description = models.TextField(blank=True, default='')
    address = models.CharField(max_length=500, blank=True, default='')
    website = models.URLField(blank=True, null=True)
    logo = models.ImageField(upload_to='tenant_logos/', blank=True, null=True)

    class Meta:
        db_table = 'tenant_profiles'

    def __str__(self):
        return f'{self.user.full_name} - {self.organization_name or "Individual"}'

