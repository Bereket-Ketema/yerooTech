from django.urls import re_path
from . import views

urlpatterns = [
    re_path(r'^unread-count/?$', views.UnreadNotificationCountView.as_view(), name='notification-unread-count'),
    re_path(r'^mark-all-read/?$', views.MarkAllNotificationsReadView.as_view(), name='notification-mark-all-read'),
    re_path(r'^(?P<pk>[0-9a-f-]+)/read/?$', views.MarkNotificationReadView.as_view(), name='notification-mark-read'),
    re_path(r'^$', views.NotificationListView.as_view(), name='notification-list'),
]
