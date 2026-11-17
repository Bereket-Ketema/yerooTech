"""Group views."""
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import AttendanceGroup, GroupMembership
from .serializers import (
    AttendanceGroupSerializer,
    AttendanceGroupCreateSerializer,
    GroupMembershipSerializer,
    JoinGroupSerializer,
)
from apps.core.permissions import IsApprovedAttendanceTaker, IsParticipant, IsOwnerOrAdmin
from apps.core.utils import generate_qr_code_base64


class AttendanceGroupViewSet(viewsets.ModelViewSet):
    """CRUD operations for attendance groups (owner only)."""
    permission_classes = [IsApprovedAttendanceTaker]

    def get_serializer_class(self):
        if self.action == 'create':
            return AttendanceGroupCreateSerializer
        return AttendanceGroupSerializer

    def get_queryset(self):
        """Only return groups owned by the requesting user."""
        return AttendanceGroup.objects.filter(
            owner=self.request.user
        ).prefetch_related('memberships')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        group = serializer.save()
        return Response({
            'success': True,
            'message': 'Group created successfully.',
            'data': AttendanceGroupSerializer(group).data
        }, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
        instance = self.get_object()
        serializer = AttendanceGroupCreateSerializer(
            instance, data=request.data, partial=partial,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'success': True,
            'data': AttendanceGroupSerializer(instance).data
        })

    @action(detail=True, methods=['get'])
    def registration_qr(self, request, pk=None):
        """Generate QR code for group registration."""
        group = self.get_object()
        # QR data contains the invite URL
        qr_data = f'{request.scheme}://{request.get_host()}/join/{group.invite_token}'
        qr_base64 = generate_qr_code_base64(qr_data)
        return Response({
            'success': True,
            'data': {
                'qr_code': qr_base64,
                'invite_token': str(group.invite_token),
                'invite_url': qr_data,
                'unique_code': group.unique_code,
            }
        })

    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """List group members."""
        group = self.get_object()
        memberships = GroupMembership.objects.filter(
            group=group
        ).select_related('participant')
        serializer = GroupMembershipSerializer(memberships, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })

    @action(detail=True, methods=['post'])
    def remove_member(self, request, pk=None):
        """Remove a member from the group."""
        group = self.get_object()
        participant_id = request.data.get('participant_id')
        try:
            membership = GroupMembership.objects.get(
                group=group, participant_id=participant_id
            )
            membership.status = 'removed'
            membership.save()
            return Response({
                'success': True,
                'message': 'Member removed successfully.'
            })
        except GroupMembership.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Member not found.'
            }, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Archive a group."""
        group = self.get_object()
        group.status = AttendanceGroup.Status.ARCHIVED
        group.save()
        return Response({
            'success': True,
            'message': 'Group archived successfully.'
        })


class JoinGroupView(generics.CreateAPIView):
    """Allow participants to join a group."""
    serializer_class = JoinGroupSerializer
    permission_classes = [IsParticipant]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        invite_token = serializer.validated_data.get('invite_token')
        unique_code = serializer.validated_data.get('unique_code')

        # Find group
        group = None
        if invite_token:
            group = AttendanceGroup.objects.filter(invite_token=invite_token).first()
        if not group and unique_code:
            group = AttendanceGroup.objects.filter(unique_code=unique_code).first()

        if not group:
            return Response({
                'success': False,
                'message': 'Group not found.'
            }, status=status.HTTP_404_NOT_FOUND)

        if group.status != AttendanceGroup.Status.ACTIVE:
            return Response({
                'success': False,
                'message': 'This group is not accepting new members.'
            }, status=status.HTTP_400_BAD_REQUEST)

        if not group.registration_open:
            return Response({
                'success': False,
                'message': 'Registration is closed for this group.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check max participants
        if group.max_participants:
            current_count = group.memberships.filter(status='active').count()
            if current_count >= group.max_participants:
                return Response({
                    'success': False,
                    'message': 'Group is full.'
                }, status=status.HTTP_400_BAD_REQUEST)

        # Check existing membership
        existing = GroupMembership.objects.filter(
            group=group, participant=request.user
        ).first()
        if existing:
            if existing.status == 'active':
                return Response({
                    'success': False,
                    'message': 'You are already a member of this group.'
                }, status=status.HTTP_400_BAD_REQUEST)
            # Rejoin
            existing.status = 'active'
            existing.joined_via = 'invite_link' if invite_token else 'direct'
            existing.save()
        else:
            GroupMembership.objects.create(
                group=group,
                participant=request.user,
                joined_via='invite_link' if invite_token else 'direct'
            )

        return Response({
            'success': True,
            'message': f'Successfully joined {group.name}.',
            'data': AttendanceGroupSerializer(group).data
        }, status=status.HTTP_201_CREATED)


class ParticipantGroupsView(generics.ListAPIView):
    """List groups a participant belongs to."""
    serializer_class = AttendanceGroupSerializer
    permission_classes = [IsParticipant]

    def get_queryset(self):
        return AttendanceGroup.objects.filter(
            memberships__participant=self.request.user,
            memberships__status='active'
        )

