"""Tenant serializers."""
from rest_framework import serializers
from .models import TenantProfile
from apps.accounts.serializers import UserProfileSerializer
from apps.accounts.models import User


class TenantProfileSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True)

    class Meta:
        model = TenantProfile
        fields = ['id', 'user', 'organization_name', 'organization_type',
                  'description', 'address', 'website', 'created_at']
        read_only_fields = ['id', 'created_at']


class AdminUserListSerializer(serializers.ModelSerializer):
    """Serializer for admin to list/manage users."""
    full_name = serializers.ReadOnlyField()
    tenant_profile = TenantProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone_number', 'role', 'account_status', 'is_active',
            'date_joined', 'tenant_profile'
        ]


class AdminAccountActionSerializer(serializers.Serializer):
    """Serializer for admin account actions (approve/reject/suspend)."""
    action = serializers.ChoiceField(choices=['approve', 'reject', 'suspend', 'reactivate'])
    reason = serializers.CharField(required=False, allow_blank=True)

