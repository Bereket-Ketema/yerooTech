from django.urls import re_path
from . import admin_views

urlpatterns = [
    re_path(r'^dashboard/?$', admin_views.AdminDashboardView.as_view(), name='admin-dashboard'),
    re_path(r'^users/?$', admin_views.AdminUserListView.as_view(), name='admin-users'),
    re_path(r'^users/(?P<pk>[0-9a-f-]+)/?$', admin_views.AdminUserDetailView.as_view(), name='admin-user-detail'),
    re_path(r'^users/(?P<pk>[0-9a-f-]+)/action/?$', admin_views.AdminAccountActionView.as_view(), name='admin-user-action'),
    re_path(r'^pending/?$', admin_views.AdminPendingRegistrationsView.as_view(), name='admin-pending'),
]
