from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import SubscriptionPlan, TenantSubscription
from .serializers import SubscriptionPlanSerializer, TenantSubscriptionSerializer
from apps.core.permissions import IsApprovedAttendanceTaker

class SubscriptionPlanListView(generics.ListAPIView):
    """List available plans for informational purposes."""
    permission_classes = [permissions.AllowAny]
    serializer_class = SubscriptionPlanSerializer
    queryset = SubscriptionPlan.objects.filter(is_active=True)

class MySubscriptionView(APIView):
    """View tenant's current plan info (defaults to active unlimited free/default plan)."""
    permission_classes = [IsApprovedAttendanceTaker]

    def get(self, request):
        sub, _ = TenantSubscription.objects.get_or_create(
            tenant=request.user,
            defaults={'status': TenantSubscription.Status.ACTIVE}
        )
        return Response({
            'success': True,
            'data': TenantSubscriptionSerializer(sub).data,
            'message': 'Subscription system is in preview/free mode. All features are currently unlocked.'
        })

