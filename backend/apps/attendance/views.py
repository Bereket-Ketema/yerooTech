"""Attendance views — sessions, records, and all attendance methods."""
import uuid
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.conf import settings
from datetime import timedelta

from .models import AttendanceSession, AttendanceRecord, AttendanceAuditLog
from .serializers import (
    AttendanceSessionSerializer,
    AttendanceSessionCreateSerializer,
    AttendanceRecordSerializer,
    QRAttendanceSerializer,
    GPSAttendanceSerializer,
    PINAttendanceSerializer,
    ManualAttendanceSerializer,
    BulkManualAttendanceSerializer,
    ModifyAttendanceSerializer,
    AttendanceAuditLogSerializer,
)
from apps.groups.models import GroupMembership
from apps.core.permissions import IsApprovedAttendanceTaker, IsParticipant, IsAttendanceTakerOrParticipant
from apps.core.utils import calculate_distance_meters, generate_qr_code_base64, generate_pin_code


class AttendanceSessionViewSet(viewsets.ModelViewSet):
    """CRUD for attendance sessions (owner only)."""
    permission_classes = [IsApprovedAttendanceTaker]

    def get_serializer_class(self):
        if self.action == 'create':
            return AttendanceSessionCreateSerializer
        return AttendanceSessionSerializer

    def get_queryset(self):
        qs = AttendanceSession.objects.filter(
            owner=self.request.user
        ).select_related('group')
        group_id = self.request.query_params.get('group')
        if group_id:
            qs = qs.filter(group_id=group_id)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        date_filter = self.request.query_params.get('date')
        if date_filter:
            qs = qs.filter(session_date=date_filter)
        return qs

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        session = serializer.save()
        return Response({
            'success': True,
            'message': 'Session created successfully.',
            'data': AttendanceSessionSerializer(session).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """Start an attendance session."""
        session = self.get_object()
        session.status = AttendanceSession.Status.ACTIVE
        session.start_time = timezone.now()
        if session.attendance_method == 'qr_code':
            session.qr_token = uuid.uuid4()
            session.qr_expires_at = timezone.now() + timedelta(
                seconds=settings.QR_CODE_EXPIRY_SECONDS
            )
        if session.attendance_method == 'pin':
            session.pin_code = generate_pin_code(settings.PIN_CODE_LENGTH)
            session.pin_expires_at = timezone.now() + timedelta(
                seconds=settings.PIN_CODE_EXPIRY_SECONDS
            )
        session.save()
        return Response({
            'success': True,
            'message': 'Session started.',
            'data': AttendanceSessionSerializer(session).data
        })

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        """Close an attendance session."""
        session = self.get_object()
        session.status = AttendanceSession.Status.CLOSED
        session.end_time = timezone.now()
        session.save()
        return Response({
            'success': True,
            'message': 'Session closed.',
            'data': AttendanceSessionSerializer(session).data
        })

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel an attendance session."""
        session = self.get_object()
        session.status = AttendanceSession.Status.CANCELLED
        session.save()
        return Response({
            'success': True,
            'message': 'Session cancelled.'
        })

    @action(detail=True, methods=['get'])
    def qr_code(self, request, pk=None):
        """Get QR code for active session."""
        session = self.get_object()
        if session.status != AttendanceSession.Status.ACTIVE:
            return Response({
                'success': False,
                'message': 'Session is not active.'
            }, status=status.HTTP_400_BAD_REQUEST)

        qr_data = str(session.qr_token)
        qr_base64 = generate_qr_code_base64(qr_data)
        return Response({
            'success': True,
            'data': {
                'qr_code': qr_base64,
                'qr_token': str(session.qr_token),
                'expires_at': session.qr_expires_at,
            }
        })

    @action(detail=True, methods=['post'])
    def refresh_qr(self, request, pk=None):
        """Regenerate QR token for anti-replay."""
        session = self.get_object()
        if session.status != AttendanceSession.Status.ACTIVE:
            return Response({
                'success': False,
                'message': 'Session is not active.'
            }, status=status.HTTP_400_BAD_REQUEST)

        session.qr_token = uuid.uuid4()
        session.qr_expires_at = timezone.now() + timedelta(
            seconds=settings.QR_CODE_EXPIRY_SECONDS
        )
        session.save()

        qr_base64 = generate_qr_code_base64(str(session.qr_token))
        return Response({
            'success': True,
            'data': {
                'qr_code': qr_base64,
                'qr_token': str(session.qr_token),
                'expires_at': session.qr_expires_at,
            }
        })

    @action(detail=True, methods=['get'])
    def records(self, request, pk=None):
        """Get attendance records for a session."""
        session = self.get_object()
        records = AttendanceRecord.objects.filter(
            session=session
        ).select_related('participant')
        serializer = AttendanceRecordSerializer(records, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })

    @action(detail=True, methods=['post'])
    def manual_attendance(self, request, pk=None):
        """Mark attendance manually for single participant."""
        session = self.get_object()
        serializer = ManualAttendanceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        participant_id = serializer.validated_data['participant_id']
        att_status = serializer.validated_data['status']
        reason = serializer.validated_data.get('reason', '')

        # Verify participant is in the group
        is_member = GroupMembership.objects.filter(
            group=session.group,
            participant_id=participant_id,
            status='active'
        ).exists()
        if not is_member:
            return Response({
                'success': False,
                'message': 'Participant is not a member of this group.'
            }, status=status.HTTP_400_BAD_REQUEST)

        record, created = AttendanceRecord.objects.update_or_create(
            session=session,
            participant_id=participant_id,
            defaults={
                'status': att_status,
                'method_used': 'manual',
                'modified_by': request.user,
                'modification_reason': reason,
                'is_manually_modified': not created,
            }
        )

        if not created:
            AttendanceAuditLog.objects.create(
                record=record,
                changed_by=request.user,
                old_status=record.status,
                new_status=att_status,
                reason=reason,
            )

        return Response({
            'success': True,
            'message': 'Attendance recorded.',
            'data': AttendanceRecordSerializer(record).data
        })

    @action(detail=True, methods=['post'])
    def bulk_manual(self, request, pk=None):
        """Bulk manual attendance marking."""
        session = self.get_object()
        serializer = BulkManualAttendanceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        results = []
        for entry in serializer.validated_data['records']:
            participant_id = entry['participant_id']
            att_status = entry['status']
            reason = entry.get('reason', '')

            is_member = GroupMembership.objects.filter(
                group=session.group,
                participant_id=participant_id,
                status='active'
            ).exists()
            if not is_member:
                results.append({
                    'participant_id': str(participant_id),
                    'success': False,
                    'message': 'Not a group member'
                })
                continue

            record, created = AttendanceRecord.objects.update_or_create(
                session=session,
                participant_id=participant_id,
                defaults={
                    'status': att_status,
                    'method_used': 'manual',
                    'modified_by': request.user,
                    'is_manually_modified': not created,
                }
            )
            results.append({
                'participant_id': str(participant_id),
                'success': True,
                'status': att_status
            })

        return Response({
            'success': True,
            'data': results
        })


class SubmitQRAttendanceView(APIView):
    """Participant submits attendance via QR code."""
    permission_classes = [IsParticipant]

    def post(self, request):
        serializer = QRAttendanceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        qr_token = serializer.validated_data['qr_token']

        try:
            session = AttendanceSession.objects.get(qr_token=qr_token)
        except AttendanceSession.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Invalid QR code.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validate session
        if session.status != AttendanceSession.Status.ACTIVE:
            return Response({
                'success': False,
                'message': 'This attendance session is not active.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check QR expiry
        if session.qr_expires_at and timezone.now() > session.qr_expires_at:
            return Response({
                'success': False,
                'message': 'QR code has expired. Please scan the new code.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check membership
        is_member = GroupMembership.objects.filter(
            group=session.group,
            participant=request.user,
            status='active'
        ).exists()
        if not is_member:
            return Response({
                'success': False,
                'message': 'You are not a member of this group.'
            }, status=status.HTTP_403_FORBIDDEN)

        # Check duplicate
        if AttendanceRecord.objects.filter(
            session=session, participant=request.user
        ).exists():
            return Response({
                'success': False,
                'message': 'You have already submitted attendance for this session.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Determine status (late check)
        att_status = 'present'
        if session.start_time:
            minutes_elapsed = (timezone.now() - session.start_time).total_seconds() / 60
            if minutes_elapsed > session.late_threshold_minutes:
                att_status = 'late'

        # GPS verification if enabled
        gps_distance = None
        lat = serializer.validated_data.get('latitude')
        lon = serializer.validated_data.get('longitude')
        if session.allow_gps_verification and lat and lon:
            if session.gps_latitude and session.gps_longitude:
                gps_distance = calculate_distance_meters(
                    session.gps_latitude, session.gps_longitude, lat, lon
                )
                if gps_distance > session.gps_radius_meters:
                    return Response({
                        'success': False,
                        'message': f'You are {gps_distance:.0f}m away. Must be within {session.gps_radius_meters}m.'
                    }, status=status.HTTP_400_BAD_REQUEST)

        record = AttendanceRecord.objects.create(
            session=session,
            participant=request.user,
            status=att_status,
            method_used='qr_code',
            participant_latitude=lat,
            participant_longitude=lon,
            gps_distance_meters=gps_distance,
        )

        return Response({
            'success': True,
            'message': f'Attendance recorded as {att_status}.',
            'data': AttendanceRecordSerializer(record).data
        })


class SubmitGPSAttendanceView(APIView):
    """Participant submits attendance via GPS."""
    permission_classes = [IsParticipant]

    def post(self, request):
        serializer = GPSAttendanceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        session_id = serializer.validated_data['session_id']
        lat = serializer.validated_data['latitude']
        lon = serializer.validated_data['longitude']

        try:
            session = AttendanceSession.objects.get(id=session_id)
        except AttendanceSession.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Session not found.'
            }, status=status.HTTP_404_NOT_FOUND)

        if session.status != AttendanceSession.Status.ACTIVE:
            return Response({
                'success': False,
                'message': 'Session is not active.'
            }, status=status.HTTP_400_BAD_REQUEST)

        if session.attendance_method != 'gps':
            return Response({
                'success': False,
                'message': 'This session does not use GPS attendance.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check membership
        is_member = GroupMembership.objects.filter(
            group=session.group,
            participant=request.user,
            status='active'
        ).exists()
        if not is_member:
            return Response({
                'success': False,
                'message': 'You are not a member of this group.'
            }, status=status.HTTP_403_FORBIDDEN)

        # Duplicate check
        if AttendanceRecord.objects.filter(
            session=session, participant=request.user
        ).exists():
            return Response({
                'success': False,
                'message': 'Already submitted.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Calculate distance
        if not session.gps_latitude or not session.gps_longitude:
            return Response({
                'success': False,
                'message': 'GPS location not configured for this session.'
            }, status=status.HTTP_400_BAD_REQUEST)

        distance = calculate_distance_meters(
            session.gps_latitude, session.gps_longitude, lat, lon
        )

        if distance > session.gps_radius_meters:
            return Response({
                'success': False,
                'message': f'You are {distance:.0f}m away from the required location. '
                           f'Must be within {session.gps_radius_meters}m.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Late check
        att_status = 'present'
        if session.start_time:
            elapsed = (timezone.now() - session.start_time).total_seconds() / 60
            if elapsed > session.late_threshold_minutes:
                att_status = 'late'

        record = AttendanceRecord.objects.create(
            session=session,
            participant=request.user,
            status=att_status,
            method_used='gps',
            participant_latitude=lat,
            participant_longitude=lon,
            gps_distance_meters=distance,
        )

        return Response({
            'success': True,
            'message': f'Attendance recorded as {att_status}. Distance: {distance:.0f}m.',
            'data': AttendanceRecordSerializer(record).data
        })


class SubmitPINAttendanceView(APIView):
    """Participant submits attendance via PIN code."""
    permission_classes = [IsParticipant]

    def post(self, request):
        serializer = PINAttendanceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        session_id = serializer.validated_data['session_id']
        pin_code = serializer.validated_data['pin_code']

        try:
            session = AttendanceSession.objects.get(id=session_id)
        except AttendanceSession.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Session not found.'
            }, status=status.HTTP_404_NOT_FOUND)

        if session.status != AttendanceSession.Status.ACTIVE:
            return Response({
                'success': False,
                'message': 'Session is not active.'
            }, status=status.HTTP_400_BAD_REQUEST)

        if session.attendance_method != 'pin':
            return Response({
                'success': False,
                'message': 'This session does not use PIN attendance.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Verify PIN
        if session.pin_code != pin_code:
            return Response({
                'success': False,
                'message': 'Invalid PIN code.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check PIN expiry
        if session.pin_expires_at and timezone.now() > session.pin_expires_at:
            return Response({
                'success': False,
                'message': 'PIN code has expired.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Membership check
        is_member = GroupMembership.objects.filter(
            group=session.group,
            participant=request.user,
            status='active'
        ).exists()
        if not is_member:
            return Response({
                'success': False,
                'message': 'You are not a member of this group.'
            }, status=status.HTTP_403_FORBIDDEN)

        # Duplicate check
        if AttendanceRecord.objects.filter(
            session=session, participant=request.user
        ).exists():
            return Response({
                'success': False,
                'message': 'Already submitted.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Late check
        att_status = 'present'
        if session.start_time:
            elapsed = (timezone.now() - session.start_time).total_seconds() / 60
            if elapsed > session.late_threshold_minutes:
                att_status = 'late'

        record = AttendanceRecord.objects.create(
            session=session,
            participant=request.user,
            status=att_status,
            method_used='pin',
        )

        return Response({
            'success': True,
            'message': f'Attendance recorded as {att_status}.',
            'data': AttendanceRecordSerializer(record).data
        })


class ModifyAttendanceView(APIView):
    """Modify an attendance record (attendance taker only)."""
    permission_classes = [IsApprovedAttendanceTaker]

    def patch(self, request, record_id):
        try:
            record = AttendanceRecord.objects.select_related('session').get(id=record_id)
        except AttendanceRecord.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Record not found.'
            }, status=status.HTTP_404_NOT_FOUND)

        # Verify ownership
        if record.session.owner != request.user:
            return Response({
                'success': False,
                'message': 'Permission denied.'
            }, status=status.HTTP_403_FORBIDDEN)

        serializer = ModifyAttendanceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        old_status = record.status
        new_status = serializer.validated_data['status']
        reason = serializer.validated_data['reason']

        # Create audit log
        AttendanceAuditLog.objects.create(
            record=record,
            changed_by=request.user,
            old_status=old_status,
            new_status=new_status,
            reason=reason,
        )

        record.status = new_status
        record.modified_by = request.user
        record.modification_reason = reason
        record.is_manually_modified = True
        record.save()

        return Response({
            'success': True,
            'message': 'Attendance record updated.',
            'data': AttendanceRecordSerializer(record).data
        })


class ParticipantActiveSessionsView(generics.ListAPIView):
    """List active sessions for groups a participant belongs to."""
    serializer_class = AttendanceSessionSerializer
    permission_classes = [IsParticipant]

    def get_queryset(self):
        user_groups = GroupMembership.objects.filter(
            participant=self.request.user,
            status='active'
        ).values_list('group_id', flat=True)

        return AttendanceSession.objects.filter(
            group_id__in=user_groups,
            status=AttendanceSession.Status.ACTIVE
        ).select_related('group')


class ParticipantAttendanceHistoryView(generics.ListAPIView):
    """List attendance history for a participant."""
    serializer_class = AttendanceRecordSerializer
    permission_classes = [IsParticipant]

    def get_queryset(self):
        return AttendanceRecord.objects.filter(
            participant=self.request.user
        ).select_related('session', 'session__group')


class TakerDashboardView(APIView):
    """Dashboard stats for attendance taker."""
    permission_classes = [IsApprovedAttendanceTaker]

    def get(self, request):
        from apps.groups.models import AttendanceGroup
        user = request.user
        today = timezone.now().date()

        groups = AttendanceGroup.objects.filter(owner=user)
        sessions = AttendanceSession.objects.filter(owner=user)
        today_sessions = sessions.filter(session_date=today)

        # Today's stats
        today_records = AttendanceRecord.objects.filter(
            session__owner=user,
            session__session_date=today
        )

        # Total participants across all groups
        total_participants = GroupMembership.objects.filter(
            group__owner=user,
            status='active'
        ).values('participant').distinct().count()

        stats = {
            'total_groups': groups.count(),
            'active_groups': groups.filter(status='active').count(),
            'total_participants': total_participants,
            'total_sessions': sessions.count(),
            'today_sessions': today_sessions.count(),
            'today_present': today_records.filter(status='present').count(),
            'today_late': today_records.filter(status='late').count(),
            'today_absent': today_records.filter(status='absent').count(),
            'today_excused': today_records.filter(status='excused').count(),
        }

        # Recent sessions
        recent_sessions = AttendanceSessionSerializer(
            sessions.order_by('-created_at')[:5], many=True
        ).data

        return Response({
            'success': True,
            'data': {
                'stats': stats,
                'recent_sessions': recent_sessions,
            }
        })

