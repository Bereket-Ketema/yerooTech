export type UserRole = 'platform_admin' | 'attendance_taker' | 'participant';
export type AccountStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone_number?: string;
  role: UserRole;
  account_status: AccountStatus;
  avatar_url?: string;
  phone_verified?: boolean;
  email_verified?: boolean;
  date_joined?: string;
  tenant_profile?: TenantProfile;
}

export interface TenantProfile {
  id: string;
  organization_name: string;
  organization_type: string;
  description: string;
  address: string;
  website?: string;
}

export interface ParticipantProfile {
  id: string;
  user: User;
  identifier: string;
  department: string;
  organization_or_school: string;
  gender: string;
  nfc_card_uid?: string;
}

export interface AttendanceGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  unique_code: string;
  status: 'active' | 'archived' | 'draft';
  registration_open: boolean;
  max_participants?: number;
  invite_token: string;
  participant_count: number;
  session_count: number;
  owner_name: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group: string;
  group_name: string;
  participant: User;
  status: 'active' | 'removed' | 'left';
  joined_at: string;
  joined_via: string;
}

export type AttendanceMethod = 'qr_code' | 'gps' | 'manual' | 'pin' | 'nfc';
export type SessionStatus = 'scheduled' | 'active' | 'paused' | 'closed' | 'cancelled';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceSession {
  id: string;
  group: string;
  group_name: string;
  title: string;
  description: string;
  session_date: string;
  start_time?: string;
  end_time?: string;
  attendance_method: AttendanceMethod;
  status: SessionStatus;
  qr_token: string;
  gps_latitude?: number;
  gps_longitude?: number;
  gps_radius_meters: number;
  pin_code?: string;
  pin_expires_at?: string;
  qr_expires_at?: string;
  late_threshold_minutes: number;
  allow_gps_verification: boolean;
  total_records: number;
  present_count: number;
  late_count: number;
  owner_name: string;
}

export interface AttendanceRecord {
  id: string;
  session: string;
  participant: string;
  participant_name: string;
  participant_email: string;
  status: AttendanceStatus;
  recorded_at: string;
  method_used: AttendanceMethod;
  participant_latitude?: number;
  participant_longitude?: number;
  gps_distance_meters?: number;
  is_manually_modified: boolean;
  modification_reason?: string;
}

export interface DashboardStats {
  total_groups: number;
  active_groups: number;
  total_participants: number;
  total_sessions: number;
  today_sessions: number;
  today_present: number;
  today_late: number;
  today_absent: number;
  today_excused: number;
}
