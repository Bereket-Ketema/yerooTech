from django.contrib import admin
from .models import ParticipantProfile

@admin.register(ParticipantProfile)
class ParticipantProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'identifier', 'department', 'gender', 'nfc_card_uid']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'identifier', 'department']

