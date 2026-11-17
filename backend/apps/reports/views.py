import csv
import io
from datetime import datetime
from django.http import HttpResponse
from django.db.models import Count, Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from apps.attendance.models import AttendanceSession, AttendanceRecord
from apps.groups.models import AttendanceGroup, GroupMembership
from apps.accounts.models import User
from apps.core.permissions import IsApprovedAttendanceTaker, IsPlatformAdmin

try:
    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
    OPENPYXL_AVAILABLE = True
except ImportError:
    OPENPYXL_AVAILABLE = False

try:
    from reportlab.lib.pagesizes import letter, landscape
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False


class AttendanceAnalyticsSummaryView(APIView):
    """Aggregate analytics for attendance taker."""
    permission_classes = [IsApprovedAttendanceTaker]

    def get(self, request):
        user = request.user
        group_id = request.query_params.get('group_id')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        sessions = AttendanceSession.objects.filter(owner=user)
        records = AttendanceRecord.objects.filter(session__owner=user)

        if group_id:
            sessions = sessions.filter(group_id=group_id)
            records = records.filter(session__group_id=group_id)

        if start_date:
            sessions = sessions.filter(session_date__gte=start_date)
            records = records.filter(session__session_date__gte=start_date)

        if end_date:
            sessions = sessions.filter(session_date__lte=end_date)
            records = records.filter(session__session_date__lte=end_date)

        total_sessions = sessions.count()
        total_records = records.count()
        present_count = records.filter(status='present').count()
        late_count = records.filter(status='late').count()
        excused_count = records.filter(status='excused').count()
        absent_count = records.filter(status='absent').count()

        # Overall presence percentage
        denominator = total_records if total_records > 0 else 1
        attendance_percentage = round(((present_count + late_count) / denominator) * 100, 1) if total_records > 0 else 0.0

        # Method breakdown
        method_counts = records.values('method_used').annotate(count=Count('id'))

        # Frequent absentees (participants with high absent count)
        frequent_absentees = records.filter(status='absent').values(
            'participant_id', 'participant__first_name', 'participant__last_name', 'participant__email'
        ).annotate(absent_count=Count('id')).order_by('-absent_count')[:10]

        return Response({
            'success': True,
            'data': {
                'total_sessions': total_sessions,
                'total_records': total_records,
                'present_count': present_count,
                'late_count': late_count,
                'excused_count': excused_count,
                'absent_count': absent_count,
                'attendance_percentage': attendance_percentage,
                'method_breakdown': list(method_counts),
                'frequent_absentees': list(frequent_absentees)
            }
        })


class ExportAttendanceCSVView(APIView):
    """Export attendance records to CSV."""
    permission_classes = [IsApprovedAttendanceTaker]

    def get(self, request):
        user = request.user
        group_id = request.query_params.get('group_id')
        session_id = request.query_params.get('session_id')

        records = AttendanceRecord.objects.filter(session__owner=user).select_related(
            'participant', 'session', 'session__group'
        ).order_by('-recorded_at')

        if session_id:
            records = records.filter(session_id=session_id)
        elif group_id:
            records = records.filter(session__group_id=group_id)

        response = HttpResponse(content_type='text/csv')
        filename = f"attendance_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'

        writer = csv.writer(response)
        writer.writerow([
            'Participant Name', 'Participant Email', 'Group Name',
            'Session Title', 'Session Date', 'Status',
            'Method', 'GPS Distance (m)', 'Recorded At', 'Modified Manually', 'Modification Reason'
        ])

        for r in records:
            writer.writerow([
                r.participant.full_name,
                r.participant.email,
                r.session.group.name,
                r.session.title,
                str(r.session.session_date),
                r.status,
                r.method_used,
                f"{r.gps_distance_meters:.1f}" if r.gps_distance_meters else "N/A",
                r.recorded_at.strftime("%Y-%m-%d %H:%M:%S") if r.recorded_at else "",
                "Yes" if r.is_manually_modified else "No",
                r.modification_reason or ""
            ])

        return response


class ExportAttendanceExcelView(APIView):
    """Export attendance records to Excel (.xlsx)."""
    permission_classes = [IsApprovedAttendanceTaker]

    def get(self, request):
        if not OPENPYXL_AVAILABLE:
            return Response({'error': 'openpyxl library not installed.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        user = request.user
        group_id = request.query_params.get('group_id')
        session_id = request.query_params.get('session_id')

        records = AttendanceRecord.objects.filter(session__owner=user).select_related(
            'participant', 'session', 'session__group'
        ).order_by('-recorded_at')

        if session_id:
            records = records.filter(session_id=session_id)
        elif group_id:
            records = records.filter(session__group_id=group_id)

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Attendance Report"

        # Headers
        headers = [
            'Participant Name', 'Participant Email', 'Group Name',
            'Session Title', 'Date', 'Status', 'Method',
            'GPS Distance (m)', 'Recorded At', 'Manually Modified', 'Reason'
        ]
        ws.append(headers)

        header_font = Font(name='Calibri', size=11, bold=True, color='FFFFFF')
        header_fill = PatternFill(start_color='1E3A8A', end_color='1E3A8A', fill_type='solid')

        for col_num, _ in enumerate(headers, 1):
            cell = ws.cell(row=1, column=col_num)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = Alignment(horizontal='center', vertical='center')

        for r in records:
            ws.append([
                r.participant.full_name,
                r.participant.email,
                r.session.group.name,
                r.session.title,
                str(r.session.session_date),
                r.status.upper(),
                r.method_used,
                f"{r.gps_distance_meters:.1f}" if r.gps_distance_meters else "-",
                r.recorded_at.strftime("%Y-%m-%d %H:%M:%S") if r.recorded_at else "",
                "Yes" if r.is_manually_modified else "No",
                r.modification_reason or ""
            ])

        for col in ws.columns:
            max_len = max(len(str(cell.value or '')) for cell in col)
            col_letter = openpyxl.utils.get_column_letter(col[0].column)
            ws.column_dimensions[col_letter].width = max(max_len + 4, 12)

        output = io.BytesIO()
        wb.save(output)
        output.seek(0)

        response = HttpResponse(
            output.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        filename = f"attendance_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response


class ExportAttendancePDFView(APIView):
    """Export attendance records to PDF."""
    permission_classes = [IsApprovedAttendanceTaker]

    def get(self, request):
        if not REPORTLAB_AVAILABLE:
            return Response({'error': 'reportlab library not installed.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        user = request.user
        group_id = request.query_params.get('group_id')
        session_id = request.query_params.get('session_id')

        records = AttendanceRecord.objects.filter(session__owner=user).select_related(
            'participant', 'session', 'session__group'
        ).order_by('-recorded_at')

        if session_id:
            records = records.filter(session_id=session_id)
        elif group_id:
            records = records.filter(session__group_id=group_id)

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=landscape(letter),
            rightMargin=30,
            leftMargin=30,
            topMargin=30,
            bottomMargin=30
        )
        elements = []
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontSize=18,
            leading=22,
            textColor=colors.HexColor('#1E3A8A'),
            spaceAfter=10
        )
        meta_style = ParagraphStyle(
            'MetaStyle',
            parent=styles['Normal'],
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#4B5563'),
            spaceAfter=15
        )

        elements.append(Paragraph("YerooTech - Attendance Report", title_style))
        elements.append(Paragraph(
            f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | Generated By: {user.full_name}",
            meta_style
        ))

        table_data = [[
            'Participant', 'Email', 'Group', 'Session', 'Date', 'Status', 'Method'
        ]]

        for r in records[:250]:  # Cap at 250 rows for clean PDF rendering
            table_data.append([
                r.participant.full_name[:20],
                r.participant.email[:25],
                r.session.group.name[:20],
                r.session.title[:20],
                str(r.session.session_date),
                r.status.upper(),
                r.method_used.replace('_', ' ').title()
            ])

        table = Table(table_data, colWidths=[110, 150, 110, 110, 75, 75, 75])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E3A8A')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F9FAFB')]),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('ALIGN', (4, 0), (-1, -1), 'CENTER'),
        ]))

        elements.append(table)
        doc.build(elements)
        buffer.seek(0)

        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        filename = f"attendance_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

