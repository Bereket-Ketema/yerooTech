from rest_framework import serializers
from .models import ParticipantProfile
from apps.accounts.serializers import UserProfileSerializer

class ParticipantProfileSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True)

    class Meta:
        model = ParticipantProfile
        fields = [
            'id', 'user', 'identifier', 'department',
            'organization_or_school', 'gender', 'nfc_card_uid',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class ParticipantProfileUpdateSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name', required=False)
    last_name = serializers.CharField(source='user.last_name', required=False)
    phone_number = serializers.CharField(source='user.phone_number', required=False)

    class Meta:
        model = ParticipantProfile
        fields = [
            'first_name', 'last_name', 'phone_number',
            'identifier', 'department', 'organization_or_school',
            'gender', 'notes'
        ]

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        if user_data:
            user = instance.user
            for attr, val in user_data.items():
                setattr(user, attr, val)
            user.save()
        return super().update(instance, validated_data)

