from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import uuid
from apps.accounts.models import User
from apps.tenants.models import TenantProfile
from apps.participants.models import ParticipantProfile
from apps.groups.models import AttendanceGroup, GroupMembership
from apps.attendance.models import AttendanceSession, AttendanceRecord
from apps.subscriptions.models import SubscriptionPlan, TenantSubscription

class Command(BaseCommand):
    help = 'Seeds initial demonstration data and default admin/taker/participant accounts.'

    def handle(self, *args, **options):
        self.stdout.write('Seeding initial data...')

        # 1. Platform Admin
        admin_user, created = User.objects.get_or_create(
            email='admin@yerootech.com',
            defaults={
                'first_name': 'Super',
                'last_name': 'Admin',
                'role': User.Role.PLATFORM_ADMIN,
                'account_status': User.AccountStatus.APPROVED,
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            admin_user.set_password('Admin@123456')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS('Created Admin: admin@yerootech.com / Admin@123456'))

        # 2. Approved Attendance Taker
        taker_user, created = User.objects.get_or_create(
            email='taker@yerootech.com',
            defaults={
                'first_name': 'Abebe',
                'last_name': 'Kebede',
                'phone_number': '+251911223344',
                'role': User.Role.ATTENDANCE_TAKER,
                'account_status': User.AccountStatus.APPROVED,
            }
        )
        if created:
            taker_user.set_password('Taker@123456')
            taker_user.save()
            TenantProfile.objects.create(
                user=taker_user,
                organization_name='Addis Ababa Institute of Technology',
                organization_type='university',
                description='Department of Software Engineering'
            )
            self.stdout.write(self.style.SUCCESS('Created Approved Taker: taker@yerootech.com / Taker@123456'))

        # 3. Pending Attendance Taker
        pending_user, created = User.objects.get_or_create(
            email='pending@yerootech.com',
            defaults={
                'first_name': 'Sara',
                'last_name': 'Mohammed',
                'phone_number': '+251922334455',
                'role': User.Role.ATTENDANCE_TAKER,
                'account_status': User.AccountStatus.PENDING,
            }
        )
        if created:
            pending_user.set_password('Pending@123456')
            pending_user.save()
            TenantProfile.objects.create(
                user=pending_user,
                organization_name='Oromia Training Center',
                organization_type='training_center'
            )
            self.stdout.write(self.style.SUCCESS('Created Pending Taker: pending@yerootech.com / Pending@123456'))

        # 4. Participants
        students_info = [
            ('Bereket', 'Ketema', 'student1@yerootech.com', 'UGR/1234/15', 'Software Engineering'),
            ('Chaltu', 'Tolosa', 'student2@yerootech.com', 'UGR/5678/15', 'Computer Science'),
            ('Dawit', 'Alemu', 'student3@yerootech.com', 'UGR/9012/15', 'Electrical Engineering'),
        ]
        created_participants = []
        for fn, ln, em, ident, dept in students_info:
            p_user, created = User.objects.get_or_create(
                email=em,
                defaults={
                    'first_name': fn,
                    'last_name': ln,
                    'phone_number': '+251900000001',
                    'role': User.Role.PARTICIPANT,
                    'account_status': User.AccountStatus.APPROVED,
                }
            )
            if created:
                p_user.set_password('Student@123456')
                p_user.save()
                ParticipantProfile.objects.create(
                    user=p_user,
                    identifier=ident,
                    department=dept,
                    gender='male' if fn in ['Bereket', 'Dawit'] else 'female'
                )
                self.stdout.write(self.style.SUCCESS(f'Created Participant: {em} / Student@123456'))
            created_participants.append(p_user)

        # 5. Default Subscription Plans
        free_plan, _ = SubscriptionPlan.objects.get_or_create(
            slug='free-tier',
            defaults={
                'name': 'Community Free',
                'price': 0.00,
                'billing_cycle': SubscriptionPlan.BillingCycle.FREE,
                'max_groups': 5,
                'max_participants_per_group': 100,
            }
        )
        SubscriptionPlan.objects.get_or_create(
            slug='pro-tier',
            defaults={
                'name': 'Institution Pro',
                'price': 49.00,
                'billing_cycle': SubscriptionPlan.BillingCycle.MONTHLY,
                'max_groups': 50,
                'max_participants_per_group': 1000,
            }
        )

        TenantSubscription.objects.get_or_create(
            tenant=taker_user,
            defaults={'plan': free_plan, 'status': TenantSubscription.Status.ACTIVE}
        )

        # 6. Sample Attendance Group
        group, _ = AttendanceGroup.objects.get_or_create(
            owner=taker_user,
            name='Software Engineering Section A',
            defaults={
                'description': 'Year 4 Semester 1 Core Course - Software Architecture',
                'category': AttendanceGroup.Category.CLASS,
                'registration_open': True,
                'max_participants': 60
            }
        )

        # Enroll participants
        for p in created_participants:
            GroupMembership.objects.get_or_create(
                group=group,
                participant=p,
                defaults={'status': 'active', 'joined_via': 'direct'}
            )

        # 7. Sample Attendance Sessions
        # Session 1: Active QR session
        active_session, _ = AttendanceSession.objects.get_or_create(
            owner=taker_user,
            group=group,
            title='Lecture 01: Microservices Architecture',
            defaults={
                'description': 'Introduction to event-driven architectures & domain-driven design',
                'session_date': timezone.now().date(),
                'start_time': timezone.now() - timedelta(minutes=10),
                'attendance_method': AttendanceSession.Method.QR_CODE,
                'status': AttendanceSession.Status.ACTIVE,
                'qr_expires_at': timezone.now() + timedelta(minutes=30),
                'allow_gps_verification': True,
                'gps_latitude': 9.0300,
                'gps_longitude': 38.7600,
                'gps_radius_meters': 150,
            }
        )

        # Session 2: PIN session
        pin_session, _ = AttendanceSession.objects.get_or_create(
            owner=taker_user,
            group=group,
            title='Lab 01: Containerization & Docker',
            defaults={
                'description': 'Hands-on laboratory session for Docker orchestration',
                'session_date': timezone.now().date(),
                'start_time': timezone.now() - timedelta(minutes=5),
                'attendance_method': AttendanceSession.Method.PIN,
                'status': AttendanceSession.Status.ACTIVE,
                'pin_code': '842915',
                'pin_expires_at': timezone.now() + timedelta(minutes=45),
            }
        )

        # Sample Attendance Records
        if created_participants:
            AttendanceRecord.objects.get_or_create(
                session=active_session,
                participant=created_participants[0],
                defaults={'status': 'present', 'method_used': 'qr_code'}
            )
            if len(created_participants) > 1:
                AttendanceRecord.objects.get_or_create(
                    session=active_session,
                    participant=created_participants[1],
                    defaults={'status': 'late', 'method_used': 'qr_code'}
                )

        self.stdout.write(self.style.SUCCESS('Successfully seeded all demonstration data!'))

