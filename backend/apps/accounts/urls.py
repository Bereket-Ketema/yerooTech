"""Account URL configuration supporting both trailing and non-trailing slashes."""
from django.urls import re_path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    re_path(r'^register/?$', views.RegisterAttendanceTakerView.as_view(), name='register'),
    re_path(r'^register/participant/?$', views.RegisterParticipantView.as_view(), name='register-participant'),
    re_path(r'^login/?$', views.LoginView.as_view(), name='login'),
    re_path(r'^google/?$', views.GoogleAuthView.as_view(), name='google-auth'),
    re_path(r'^logout/?$', views.LogoutView.as_view(), name='logout'),
    re_path(r'^token/refresh/?$', TokenRefreshView.as_view(), name='token-refresh'),
    re_path(r'^profile/?$', views.ProfileView.as_view(), name='profile'),
    re_path(r'^change-password/?$', views.ChangePasswordView.as_view(), name='change-password'),
    re_path(r'^otp/request/?$', views.RequestOTPView.as_view(), name='otp-request'),
    re_path(r'^otp/verify/?$', views.VerifyOTPView.as_view(), name='otp-verify'),
]
