"""URL configuration for YerooTech SaaS platform."""
from django.contrib import admin
from django.urls import path, re_path, include
from django.conf import settings
from django.conf.urls.static import static
from apps.core.views import HealthCheckView

urlpatterns = [
    re_path(r'^django-admin/?', admin.site.urls),
    re_path(r'^api/v1/health/?$', HealthCheckView.as_view(), name='health_check'),
    re_path(r'^api/v1/auth/', include('apps.accounts.urls')),
    re_path(r'^api/v1/tenants/', include('apps.tenants.urls')),
    re_path(r'^api/v1/groups/', include('apps.groups.urls')),
    re_path(r'^api/v1/participants/', include('apps.participants.urls')),
    re_path(r'^api/v1/attendance/', include('apps.attendance.urls')),
    re_path(r'^api/v1/reports/', include('apps.reports.urls')),
    re_path(r'^api/v1/notifications/', include('apps.notifications.urls')),
    re_path(r'^api/v1/subscriptions/', include('apps.subscriptions.urls')),
    re_path(r'^api/v1/platform/', include('apps.tenants.admin_urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
