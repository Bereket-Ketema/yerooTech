"""Group serializers."""
from rest_framework import serializers
from .models import AttendanceGroup, GroupMembership
from apps.accounts.serializers import UserProfileSerializer


class AttendanceGroupSerializer(serializers.ModelSerializer):
    """Serializer for attendance groups."""
    participant_count = serializers.ReadOnlyField()
    session_count = serializers.ReadOnlyField()
    owner_name = serializers.CharField(source='owner.full_name', read_only=True)

    class Meta:
        model = AttendanceGroup
        fields = [
            'id', 'name', 'description', 'category', 'unique_code',
            'status', 'registration_open', 'max_participants',
            'invite_token', 'participant_count', 'session_count',
            'owner_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'unique_code', 'invite_token', 'created_at', 'updated_at']


class AttendanceGroupCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating groups."""
    class Meta:
        model = AttendanceGroup
        fields = ['name', 'description', 'category', 'registration_open', 'max_participants']

    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)


class GroupMembershipSerializer(serializers.ModelSerializer):
    """Serializer for group membership."""
    participant = UserProfileSerializer(read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)

    class Meta:
        model = GroupMembership
        fields = [
            'id', 'group', 'group_name', 'participant',
            'status', 'joined_at', 'joined_via'
        ]
        read_only_fields = ['id', 'joined_at']


class JoinGroupSerializer(serializers.Serializer):
    """Serializer for joining a group."""
    invite_token = serializers.UUIDField(required=False)
    unique_code = serializers.CharField(required=False, max_length=12)

    def validate(self, data):
        if not data.get('invite_token') and not data.get('unique_code'):
            raise serializers.ValidationError(
                'Either invite_token or unique_code is required.'
            )
        return data

