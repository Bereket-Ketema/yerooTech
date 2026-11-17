from django.urls import path
from . import views

urlpatterns = [
    path('me/', views.ParticipantMeProfileView.as_view(), name='participant-me-profile'),
    path('taker-list/', views.TenantParticipantListView.as_view(), name='taker-participant-list'),
]

