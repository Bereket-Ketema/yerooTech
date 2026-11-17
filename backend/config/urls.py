"""URL configuration for YerooTech SaaS platform."""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from apps.core.views import HealthCheckView

urlpatterns = [
    path('django-admin/', admin.site.urls),
    path('api/v1/health/', HealthCheckView.as_view(), name='health_check'),
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/tenants/', include('apps.tenants.urls')),
    path('api/v1/groups/', include('apps.groups.urls')),
    path('api/v1/participants/', include('apps.participants.urls')),
    path('api/v1/attendance/', include('apps.attendance.urls')),
    path('api/v1/reports/', include('apps.reports.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
    path('api/v1/subscriptions/', include('apps.subscriptions.urls')),
    path('api/v1/platform/', include('apps.tenants.admin_urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

