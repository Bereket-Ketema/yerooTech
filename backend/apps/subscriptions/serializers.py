from rest_framework import serializers
from .models import SubscriptionPlan, TenantSubscription

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = '__all__'

class TenantSubscriptionSerializer(serializers.ModelSerializer):
    plan = SubscriptionPlanSerializer(read_only=True)

    class Meta:
        model = TenantSubscription
        fields = ['id', 'plan', 'status', 'current_period_start', 'current_period_end', 'cancel_at_period_end']

