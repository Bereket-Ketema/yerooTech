from django.contrib import admin
from .models import AttendanceSession, AttendanceRecord, AttendanceAuditLog

@admin.register(AttendanceSession)
class AttendanceSessionAdmin(admin.ModelAdmin):
    list_display = ['title', 'group', 'session_date', 'attendance_method', 'status', 'owner']
    list_filter = ['status', 'attendance_method', 'session_date']
    search_fields = ['title', 'group__name', 'owner__email']

@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ['session', 'participant', 'status', 'method_used', 'recorded_at', 'is_manually_modified']
    list_filter = ['status', 'method_used', 'is_manually_modified']
    search_fields = ['participant__email', 'participant__first_name', 'session__title']

@admin.register(AttendanceAuditLog)
class AttendanceAuditLogAdmin(admin.ModelAdmin):
    list_display = ['record', 'changed_by', 'old_status', 'new_status', 'changed_at']
    list_filter = ['changed_at']

