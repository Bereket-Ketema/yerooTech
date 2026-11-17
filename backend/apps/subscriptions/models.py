import uuid
from django.db import models
from apps.core.models import TimeStampedModel

class SubscriptionPlan(TimeStampedModel):
    class BillingCycle(models.TextChoices):
        FREE = 'free', 'Free Tier'
        MONTHLY = 'monthly', 'Monthly'
        ANNUAL = 'annual', 'Annual'

    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True, default='')
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    billing_cycle = models.CharField(max_length=20, choices=BillingCycle.choices, default=BillingCycle.FREE)
    max_groups = models.IntegerField(default=100, help_text='Maximum allowed groups (unlimited = -1)')
    max_participants_per_group = models.IntegerField(default=500, help_text='Maximum participants per group')
    allow_gps = models.BooleanField(default=True)
    allow_qr = models.BooleanField(default=True)
    allow_nfc = models.BooleanField(default=True)
    allow_reports_export = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'subscription_plans'
        ordering = ['price']

    def __str__(self):
        return f"{self.name} (${self.price}/{self.billing_cycle})"

class TenantSubscription(TimeStampedModel):
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        TRIAL = 'trial', 'Trial'
        PAST_DUE = 'past_due', 'Past Due'
        CANCELED = 'canceled', 'Canceled'
        EXPIRED = 'expired', 'Expired'

    tenant = models.OneToOneField(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='subscription'
    )
    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.SET_NULL,
        null=True,
        related_name='subscriptions'
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    current_period_start = models.DateTimeField(null=True, blank=True)
    current_period_end = models.DateTimeField(null=True, blank=True)
    cancel_at_period_end = models.BooleanField(default=False)
    # Payment gateway reference prepared for future integration
    gateway_customer_id = models.CharField(max_length=255, blank=True, default='')
    gateway_subscription_id = models.CharField(max_length=255, blank=True, default='')

    class Meta:
        db_table = 'tenant_subscriptions'

    def __str__(self):
        return f"{self.tenant.email} - {self.plan.name if self.plan else 'No Plan'} ({self.status})"

