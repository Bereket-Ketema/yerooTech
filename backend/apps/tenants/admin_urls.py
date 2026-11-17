from django.urls import path
from . import admin_views

urlpatterns = [
    path('dashboard/', admin_views.AdminDashboardView.as_view(), name='admin-dashboard'),
    path('users/', admin_views.AdminUserListView.as_view(), name='admin-users'),
    path('users/<uuid:pk>/', admin_views.AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('users/<uuid:pk>/action/', admin_views.AdminAccountActionView.as_view(), name='admin-user-action'),
    path('pending/', admin_views.AdminPendingRegistrationsView.as_view(), name='admin-pending'),
]

