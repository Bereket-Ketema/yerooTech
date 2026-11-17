from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.AttendanceGroupViewSet, basename='group')

urlpatterns = [
    path('join/', views.JoinGroupView.as_view(), name='join-group'),
    path('my-groups/', views.ParticipantGroupsView.as_view(), name='my-groups'),
    path('', include(router.urls)),
]

