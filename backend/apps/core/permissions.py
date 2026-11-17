"""Custom permissions for the platform."""
from rest_framework import permissions


class IsPlatformAdmin(permissions.BasePermission):
    """Allow access only to platform administrators."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'platform_admin'
        )


class IsApprovedAttendanceTaker(permissions.BasePermission):
    """Allow access only to approved attendance takers."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'attendance_taker'
            and request.user.account_status == 'approved'
        )


class IsParticipant(permissions.BasePermission):
    """Allow access only to participants."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'participant'
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """Allow access to object owner or platform admin."""
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'platform_admin':
            return True
        if hasattr(obj, 'owner'):
            return obj.owner == request.user
        return False


class IsAttendanceTakerOrParticipant(permissions.BasePermission):
    """Allow approved attendance takers and participants."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == 'attendance_taker':
            return request.user.account_status == 'approved'
        if request.user.role == 'participant':
            return True
        if request.user.role == 'platform_admin':
            return True
        return False

