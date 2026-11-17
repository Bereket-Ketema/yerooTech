"""Platform admin views for user and system management."""
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta

from apps.accounts.models import User
from apps.core.permissions import IsPlatformAdmin
from .serializers import AdminUserListSerializer, AdminAccountActionSerializer


class AdminDashboardView(APIView):
    """Platform admin dashboard statistics."""
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        takers = User.objects.filter(role='attendance_taker')
        participants = User.objects.filter(role='participant')

        stats = {
            'total_attendance_takers': takers.count(),
            'pending_registrations': takers.filter(account_status='pending').count(),
            'approved_accounts': takers.filter(account_status='approved').count(),
            'rejected_accounts': takers.filter(account_status='rejected').count(),
            'suspended_accounts': takers.filter(account_status='suspended').count(),
            'total_participants': participants.count(),
            'new_registrations_today': User.objects.filter(
                date_joined__gte=today_start
            ).count(),
        }

        # Get group and session counts
        from apps.groups.models import AttendanceGroup
        from apps.attendance.models import AttendanceSession

        stats['total_groups'] = AttendanceGroup.objects.count()
        stats['total_sessions'] = AttendanceSession.objects.count()
        stats['active_sessions_today'] = AttendanceSession.objects.filter(
            session_date=now.date()
        ).count()

        return Response({
            'success': True,
            'data': stats
        })


class AdminUserListView(generics.ListAPIView):
    """List all users with filtering."""
    serializer_class = AdminUserListSerializer
    permission_classes = [IsPlatformAdmin]
    filterset_fields = ['role', 'account_status', 'is_active']
    search_fields = ['email', 'first_name', 'last_name']
    ordering_fields = ['date_joined', 'email', 'first_name']

    def get_queryset(self):
        return User.objects.select_related('tenant_profile').all()


class AdminUserDetailView(generics.RetrieveAPIView):
    """Get detailed user information."""
    serializer_class = AdminUserListSerializer
    permission_classes = [IsPlatformAdmin]
    queryset = User.objects.select_related('tenant_profile').all()


class AdminAccountActionView(APIView):
    """Approve, reject, suspend, or reactivate an account."""
    permission_classes = [IsPlatformAdmin]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({
                'success': False,
                'message': 'User not found.'
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = AdminAccountActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        action = serializer.validated_data['action']

        action_map = {
            'approve': User.AccountStatus.APPROVED,
            'reject': User.AccountStatus.REJECTED,
            'suspend': User.AccountStatus.SUSPENDED,
            'reactivate': User.AccountStatus.APPROVED,
        }

        new_status = action_map.get(action)
        if not new_status:
            return Response({
                'success': False,
                'message': 'Invalid action.'
            }, status=status.HTTP_400_BAD_REQUEST)

        user.account_status = new_status
        user.save()

        # Create notification for the user
        from apps.notifications.models import Notification
        messages = {
            'approve': 'Your account has been approved! You can now access the platform.',
            'reject': 'Your account registration has been rejected.',
            'suspend': 'Your account has been suspended.',
            'reactivate': 'Your account has been reactivated.',
        }
        Notification.objects.create(
            user=user,
            title=f'Account {action.title()}d',
            message=messages.get(action, ''),
            notification_type='account_status'
        )

        return Response({
            'success': True,
            'message': f'Account {action}d successfully.',
            'data': AdminUserListSerializer(user).data
        })


class AdminPendingRegistrationsView(generics.ListAPIView):
    """List pending attendance taker registrations."""
    serializer_class = AdminUserListSerializer
    permission_classes = [IsPlatformAdmin]

    def get_queryset(self):
        return User.objects.filter(
            role='attendance_taker',
            account_status='pending'
        ).order_by('-date_joined')

