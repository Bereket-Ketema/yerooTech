"""Attendance serializers."""
from rest_framework import serializers
from .models import AttendanceSession, AttendanceRecord, AttendanceAuditLog
from apps.accounts.serializers import UserProfileSerializer


class AttendanceSessionSerializer(serializers.ModelSerializer):
    """Full session serializer."""
    group_name = serializers.CharField(source='group.name', read_only=True)
    owner_name = serializers.CharField(source='owner.full_name', read_only=True)
    total_records = serializers.ReadOnlyField()
    present_count = serializers.ReadOnlyField()
    late_count = serializers.ReadOnlyField()

    class Meta:
        model = AttendanceSession
        fields = [
            'id', 'group', 'group_name', 'title', 'description',
            'session_date', 'start_time', 'end_time',
            'attendance_method', 'status', 'qr_token',
            'gps_latitude', 'gps_longitude', 'gps_radius_meters',
            'pin_code', 'pin_expires_at', 'qr_expires_at',
            'late_threshold_minutes', 'allow_gps_verification',
            'total_records', 'present_count', 'late_count',
            'owner_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'qr_token', 'created_at', 'updated_at']


class AttendanceSessionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating sessions."""
    class Meta:
        model = AttendanceSession
        fields = [
            'group', 'title', 'description', 'session_date',
            'start_time', 'end_time', 'attendance_method',
            'gps_latitude', 'gps_longitude', 'gps_radius_meters',
            'late_threshold_minutes', 'allow_gps_verification'
        ]

    def validate_group(self, value):
        """Ensure the user owns the group."""
        if value.owner != self.context['request'].user:
            raise serializers.ValidationError('You do not own this group.')
        return value

    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)


class AttendanceRecordSerializer(serializers.ModelSerializer):
    """Attendance record serializer."""
    participant_name = serializers.CharField(source='participant.full_name', read_only=True)
    participant_email = serializers.CharField(source='participant.email', read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = [
            'id', 'session', 'participant', 'participant_name',
            'participant_email', 'status', 'recorded_at',
            'method_used', 'participant_latitude', 'participant_longitude',
            'gps_distance_meters', 'is_manually_modified',
            'modification_reason', 'created_at'
        ]
        read_only_fields = ['id', 'recorded_at', 'created_at']


class QRAttendanceSerializer(serializers.Serializer):
    """Serializer for QR code attendance submission."""
    qr_token = serializers.UUIDField()
    latitude = serializers.FloatField(required=False)
    longitude = serializers.FloatField(required=False)


class GPSAttendanceSerializer(serializers.Serializer):
    """Serializer for GPS attendance submission."""
    session_id = serializers.UUIDField()
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()
    accuracy = serializers.FloatField(required=False)


class PINAttendanceSerializer(serializers.Serializer):
    """Serializer for PIN attendance submission."""
    session_id = serializers.UUIDField()
    pin_code = serializers.CharField(max_length=10)


class ManualAttendanceSerializer(serializers.Serializer):
    """Serializer for manual attendance marking."""
    participant_id = serializers.UUIDField()
    status = serializers.ChoiceField(choices=AttendanceRecord.AttendanceStatus.choices)
    reason = serializers.CharField(required=False, allow_blank=True)


class BulkManualAttendanceSerializer(serializers.Serializer):
    """Serializer for bulk manual attendance."""
    records = ManualAttendanceSerializer(many=True)


class ModifyAttendanceSerializer(serializers.Serializer):
    """Serializer for modifying an attendance record."""
    status = serializers.ChoiceField(choices=AttendanceRecord.AttendanceStatus.choices)
    reason = serializers.CharField(required=True)


class AttendanceAuditLogSerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.full_name', read_only=True)

    class Meta:
        model = AttendanceAuditLog
        fields = [
            'id', 'old_status', 'new_status', 'reason',
            'changed_by_name', 'changed_at'
        ]

