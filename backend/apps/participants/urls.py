from django.urls import re_path
from . import views

urlpatterns = [
    re_path(r'^me/?$', views.ParticipantMeProfileView.as_view(), name='participant-me-profile'),
    re_path(r'^taker-list/?$', views.TenantParticipantListView.as_view(), name='taker-participant-list'),
]
