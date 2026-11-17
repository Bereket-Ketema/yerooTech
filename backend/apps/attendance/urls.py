from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'sessions', views.AttendanceSessionViewSet, basename='attendance-session')

urlpatterns = [
    path('dashboard/', views.TakerDashboardView.as_view(), name='taker-dashboard'),
    path('submit/qr/', views.SubmitQRAttendanceView.as_view(), name='submit-qr-attendance'),
    path('submit/gps/', views.SubmitGPSAttendanceView.as_view(), name='submit-gps-attendance'),
    path('submit/pin/', views.SubmitPINAttendanceView.as_view(), name='submit-pin-attendance'),
    path('record/<uuid:record_id>/modify/', views.ModifyAttendanceView.as_view(), name='modify-attendance-record'),
    path('participant/active-sessions/', views.ParticipantActiveSessionsView.as_view(), name='participant-active-sessions'),
    path('participant/history/', views.ParticipantAttendanceHistoryView.as_view(), name='participant-history'),
    path('', include(router.urls)),
]

