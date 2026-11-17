"""Account URL configuration."""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('register/', views.RegisterAttendanceTakerView.as_view(), name='register'),
    path('register/participant/', views.RegisterParticipantView.as_view(), name='register-participant'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('google/', views.GoogleAuthView.as_view(), name='google-auth'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    path('otp/request/', views.RequestOTPView.as_view(), name='otp-request'),
    path('otp/verify/', views.VerifyOTPView.as_view(), name='otp-verify'),
]

