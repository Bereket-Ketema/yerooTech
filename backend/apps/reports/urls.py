from django.urls import re_path
from . import views

urlpatterns = [
    re_path(r'^summary/?$', views.AttendanceAnalyticsSummaryView.as_view(), name='reports-summary'),
    re_path(r'^export/csv/?$', views.ExportAttendanceCSVView.as_view(), name='export-csv'),
    re_path(r'^export/excel/?$', views.ExportAttendanceExcelView.as_view(), name='export-excel'),
    re_path(r'^export/pdf/?$', views.ExportAttendancePDFView.as_view(), name='export-pdf'),
]
