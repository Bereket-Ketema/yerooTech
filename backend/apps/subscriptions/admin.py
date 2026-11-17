from django.contrib import admin
from .models import SubscriptionPlan, TenantSubscription

@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'price', 'billing_cycle', 'max_groups', 'is_active']
    list_filter = ['billing_cycle', 'is_active']

@admin.register(TenantSubscription)
class TenantSubscriptionAdmin(admin.ModelAdmin):
    list_display = ['tenant', 'plan', 'status', 'current_period_end']
    list_filter = ['status']

