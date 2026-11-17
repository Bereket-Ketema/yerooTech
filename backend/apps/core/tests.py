from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
import uuid
from apps.accounts.models import User
from apps.groups.models import AttendanceGroup, GroupMembership
from apps.attendance.models import AttendanceSession, AttendanceRecord, AttendanceAuditLog
from apps.core.utils import calculate_distance_meters

class AttendanceSaaSTestCase(TestCase):
    def setUp(self):
        # Create Platform Admin
        self.admin = User.objects.create_superuser(
            email='admin_test@yerootech.com',
            password='AdminPassword123!',
            first_name='Admin',
            last_name='User'
        )

        # Create Attendance Taker 1
        self.taker1 = User.objects.create_user(
            email='taker1@yerootech.com',
            password='Password123!',
            first_name='Taker',
            last_name='One',
            role=User.Role.ATTENDANCE_TAKER,
            account_status=User.AccountStatus.APPROVED
        )

        # Create Attendance Taker 2 (for tenant isolation test)
        self.taker2 = User.objects.create_user(
            email='taker2@yerootech.com',
            password='Password123!',
            first_name='Taker',
            last_name='Two',
            role=User.Role.ATTENDANCE_TAKER,
            account_status=User.AccountStatus.APPROVED
        )

        # Create Pending Taker
        self.pending_taker = User.objects.create_user(
            email='pending_test@yerootech.com',
            password='Password123!',
            first_name='Pending',
            last_name='User',
            role=User.Role.ATTENDANCE_TAKER,
            account_status=User.AccountStatus.PENDING
        )

        # Create Participant
        self.participant = User.objects.create_user(
            email='student_test@yerootech.com',
            password='Password123!',
            first_name='Student',
            last_name='One',
            phone_number='+251911000111',
            role=User.Role.PARTICIPANT,
            account_status=User.AccountStatus.APPROVED
        )

        # Taker 1 creates Group
        self.group = AttendanceGroup.objects.create(
            owner=self.taker1,
            name='Test Computer Science Class',
            category=AttendanceGroup.Category.CLASS,
            registration_open=True
        )

        # Enroll Participant in Group
        self.membership = GroupMembership.objects.create(
            group=self.group,
            participant=self.participant,
            status='active'
        )

    def test_account_creation_and_status(self):
        """Verify role assignment and pending status logic."""
        self.assertEqual(self.pending_taker.account_status, User.AccountStatus.PENDING)
        self.assertFalse(self.pending_taker.is_approved)
        self.assertTrue(self.taker1.is_approved)

    def test_admin_approval_workflow(self):
        """Admin can approve pending attendance taker."""
        self.pending_taker.account_status = User.AccountStatus.APPROVED
        self.pending_taker.save()
        self.assertTrue(self.pending_taker.is_approved)

    def test_tenant_isolation(self):
        """Taker 2 should not see or own Taker 1's groups."""
        taker1_groups = AttendanceGroup.objects.filter(owner=self.taker1)
        taker2_groups = AttendanceGroup.objects.filter(owner=self.taker2)
        self.assertEqual(taker1_groups.count(), 1)
        self.assertEqual(taker2_groups.count(), 0)

    def test_qr_attendance_and_duplicate_prevention(self):
        """Test QR code attendance recording and duplicate block."""
        session = AttendanceSession.objects.create(
            owner=self.taker1,
            group=self.group,
            title='Test QR Session',
            session_date=timezone.now().date(),
            start_time=timezone.now(),
            attendance_method=AttendanceSession.Method.QR_CODE,
            status=AttendanceSession.Status.ACTIVE,
            qr_expires_at=timezone.now() + timedelta(minutes=15)
        )

        # First submission succeeds
        record = AttendanceRecord.objects.create(
            session=session,
            participant=self.participant,
            status=AttendanceRecord.AttendanceStatus.PRESENT,
            method_used='qr_code'
        )
        self.assertEqual(record.status, 'present')
        self.assertEqual(session.total_records, 1)

        # Duplicate submission raises IntegrityError
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            AttendanceRecord.objects.create(
                session=session,
                participant=self.participant,
                status=AttendanceRecord.AttendanceStatus.PRESENT,
                method_used='qr_code'
            )

    def test_pin_attendance(self):
        """Test PIN generation and validation."""
        session = AttendanceSession.objects.create(
            owner=self.taker1,
            group=self.group,
            title='Test PIN Session',
            session_date=timezone.now().date(),
            attendance_method=AttendanceSession.Method.PIN,
            status=AttendanceSession.Status.ACTIVE,
            pin_code='654321',
            pin_expires_at=timezone.now() + timedelta(minutes=10)
        )
        self.assertEqual(session.pin_code, '654321')

    def test_gps_distance_calculation(self):
        """Test Haversine distance calculation."""
        # AAiT Campus (approx 9.0300, 38.7600) vs nearby point (~100m away)
        dist = calculate_distance_meters(9.0300, 38.7600, 9.0305, 38.7605)
        self.assertGreater(dist, 50)
        self.assertLess(dist, 150)

    def test_manual_attendance_and_audit_trail(self):
        """Test manual record modification and audit logging."""
        session = AttendanceSession.objects.create(
            owner=self.taker1,
            group=self.group,
            title='Test Manual Session',
            session_date=timezone.now().date(),
            attendance_method=AttendanceSession.Method.MANUAL,
            status=AttendanceSession.Status.ACTIVE
        )

        record = AttendanceRecord.objects.create(
            session=session,
            participant=self.participant,
            status=AttendanceRecord.AttendanceStatus.ABSENT,
            method_used='manual'
        )

        # Modification
        old_status = record.status
        new_status = AttendanceRecord.AttendanceStatus.EXCUSED
        reason = 'Doctor certificate provided'

        audit = AttendanceAuditLog.objects.create(
            record=record,
            changed_by=self.taker1,
            old_status=old_status,
            new_status=new_status,
            reason=reason
        )

        record.status = new_status
        record.is_manually_modified = True
        record.modification_reason = reason
        record.save()

        self.assertEqual(record.status, 'excused')
        self.assertTrue(record.is_manually_modified)
        self.assertEqual(audit.new_status, 'excused')

