"""Core app - shared base models, permissions, utilities, and exception handling."""
import uuid
from django.db import models


class TimeStampedModel(models.Model):
    """Abstract base model with created/updated timestamps."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ['-created_at']


class TenantOwnedModel(TimeStampedModel):
    """Abstract model that belongs to a tenant (attendance taker)."""
    owner = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='%(class)s_owned',
        help_text='The attendance taker who owns this record'
    )

    class Meta:
        abstract = True

