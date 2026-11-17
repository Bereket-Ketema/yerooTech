from django.urls import path
from . import views

urlpatterns = [
    path('summary/', views.AttendanceAnalyticsSummaryView.as_view(), name='reports-summary'),
    path('export/csv/', views.ExportAttendanceCSVView.as_view(), name='export-csv'),
    path('export/excel/', views.ExportAttendanceExcelView.as_view(), name='export-excel'),
    path('export/pdf/', views.ExportAttendancePDFView.as_view(), name='export-pdf'),
]

