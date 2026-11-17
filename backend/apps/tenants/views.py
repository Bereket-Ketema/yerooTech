"""Tenant views."""
from rest_framework import generics, status
from rest_framework.response import Response
from .models import TenantProfile
from .serializers import TenantProfileSerializer
from apps.core.permissions import IsApprovedAttendanceTaker


class TenantProfileView(generics.RetrieveUpdateAPIView):
    """Get or update own tenant profile."""
    serializer_class = TenantProfileSerializer
    permission_classes = [IsApprovedAttendanceTaker]

    def get_object(self):
        profile, _ = TenantProfile.objects.get_or_create(user=self.request.user)
        return profile

    def update(self, request, *args, **kwargs):
        partial = True
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'success': True,
            'data': serializer.data
        })

