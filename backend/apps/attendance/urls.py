from django.urls import path, re_path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'sessions', views.AttendanceSessionViewSet, basename='attendance-session')

urlpatterns = [
    re_path(r'^dashboard/?$', views.TakerDashboardView.as_view(), name='taker-dashboard'),
    re_path(r'^submit/qr/?$', views.SubmitQRAttendanceView.as_view(), name='submit-qr-attendance'),
    re_path(r'^submit/gps/?$', views.SubmitGPSAttendanceView.as_view(), name='submit-gps-attendance'),
    re_path(r'^submit/pin/?$', views.SubmitPINAttendanceView.as_view(), name='submit-pin-attendance'),
    re_path(r'^record/(?P<record_id>[0-9a-f-]+)/modify/?$', views.ModifyAttendanceView.as_view(), name='modify-attendance-record'),
    re_path(r'^participant/active-sessions/?$', views.ParticipantActiveSessionsView.as_view(), name='participant-active-sessions'),
    re_path(r'^participant/history/?$', views.ParticipantAttendanceHistoryView.as_view(), name='participant-history'),
    path('', include(router.urls)),
]
