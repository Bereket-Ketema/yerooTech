from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import ParticipantProfile
from .serializers import ParticipantProfileSerializer, ParticipantProfileUpdateSerializer
from apps.groups.models import GroupMembership
from apps.accounts.models import User
from apps.core.permissions import IsApprovedAttendanceTaker, IsParticipant

class ParticipantMeProfileView(generics.RetrieveUpdateAPIView):
    """View and update current participant's profile."""
    permission_classes = [IsParticipant]
    serializer_class = ParticipantProfileSerializer

    def get_object(self):
        profile, _ = ParticipantProfile.objects.get_or_create(user=self.request.user)
        return profile

    def update(self, request, *args, **kwargs):
        profile = self.get_object()
        serializer = ParticipantProfileUpdateSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'success': True,
            'message': 'Profile updated successfully.',
            'data': ParticipantProfileSerializer(profile).data
        })

class TenantParticipantListView(generics.ListAPIView):
    """List all participants enrolled across the attendance taker's groups."""
    permission_classes = [IsApprovedAttendanceTaker]
    serializer_class = ParticipantProfileSerializer

    def get_queryset(self):
        user = self.request.user
        participant_user_ids = GroupMembership.objects.filter(
            group__owner=user,
            status='active'
        ).values_list('participant_id', flat=True).distinct()

        # Ensure profiles exist
        for uid in participant_user_ids:
            ParticipantProfile.objects.get_or_create(user_id=uid)

        return ParticipantProfile.objects.filter(
            user_id__in=participant_user_ids
        ).select_related('user')

