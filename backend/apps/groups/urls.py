from django.urls import path, re_path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.AttendanceGroupViewSet, basename='group')

urlpatterns = [
    re_path(r'^join/?$', views.JoinGroupView.as_view(), name='join-group'),
    re_path(r'^my-groups/?$', views.ParticipantGroupsView.as_view(), name='my-groups'),
    path('', include(router.urls)),
]
