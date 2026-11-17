from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'first_name', 'last_name', 'role', 'account_status', 'is_active']
    list_filter = ['role', 'account_status', 'is_active']
    search_fields = ['email', 'first_name', 'last_name']
    ordering = ['-date_joined']
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal', {'fields': ('first_name', 'last_name', 'phone_number', 'avatar_url')}),
        ('Role & Status', {'fields': ('role', 'account_status')}),
        ('Verification', {'fields': ('phone_verified', 'email_verified', 'google_id')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser')}),
    )
    add_fieldsets = (
        (None, {'classes': ('wide',), 'fields': (
            'email', 'first_name', 'last_name', 'password1', 'password2', 'role'
        )}),
    )

