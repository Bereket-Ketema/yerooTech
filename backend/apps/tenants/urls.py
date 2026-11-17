from django.urls import re_path
from . import views

urlpatterns = [
    re_path(r'^profile/?$', views.TenantProfileView.as_view(), name='tenant-profile'),
]
