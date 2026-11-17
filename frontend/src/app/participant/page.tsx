"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { AttendanceSession, AttendanceRecord, AttendanceGroup } from '@/lib/types';
import { Badge } from '@/components/Badge';
import { LoadingSpinner, EmptyState } from '@/components/EmptyState';
import {
  QrCode,
  MapPin,
  KeyRound,
  CheckCircle2,
  CalendarCheck,
  GraduationCap,
  ArrowRight,
  Sparkles,
  Clock,
  ChevronRight
} from 'lucide-react';

export default function ParticipantDashboardPage() {
  const { user } = useAuth();
  const [activeSessions, setActiveSessions] = useState<AttendanceSession[]>([]);
  const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([]);
  const [groups, setGroups] = useState<AttendanceGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchParticipantHomeData();
  }, []);

  const fetchParticipantHomeData = async () => {
    try {
      setLoading(true);
      const [actRes, recRes, grpRes]: any = await Promise.all([
        api.get('/attendance/participant/active-sessions/'),
        api.get('/attendance/participant/history/'),
        api.get('/groups/my-groups/'),
      ]);

      const actList = actRes.results || actRes.data || actRes;
      const recList = recRes.results || recRes.data || recRes;
      const grpList = grpRes.results || grpRes.data || grpRes;

      setActiveSessions(Array.isArray(actList) ? actList : []);
      setRecentRecords(Array.isArray(recList) ? recList : []);
      setGroups(Array.isArray(grpList) ? grpList : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading participant portal..." />;

  // Calculate personal attendance rate
  const totalEntries = recentRecords.length;
  const presentOrLate = recentRecords.filter(r => r.status === 'present' || r.status === 'late').length;
  const attendanceRate = totalEntries > 0 ? Math.round((presentOrLate / totalEntries) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Student Welcome & Rate Card */}
      <div className="bg-gradient-to-r from-brand-900 to-indigo-900 rounded-2xl text-white p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-brand-200 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Participant / Student Portal</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">{user?.full_name}</h1>
            <p className="text-xs text-brand-200 mt-1">
              Enrolled in {groups.length} active attendance groups
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl text-center shrink-0 w-full sm:w-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-200 block">
              My Attendance Rate
            </span>
            <span className="text-3xl font-black text-white">{attendanceRate}%</span>
            <span className="text-[10px] text-brand-300 block mt-0.5">
              {presentOrLate} / {totalEntries} sessions attended
            </span>
          </div>
        </div>
      </div>

      {/* Quick Check-in Actions */}
      <div className="grid grid-cols-3 gap-3">
        <Link
          href="/participant/scan"
          className="bg-white rounded-2xl border border-slate-200 p-4 text-center hover:border-brand-500 hover:shadow-sm transition-all flex flex-col items-center justify-center group"
        >
          <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-2 group-hover:bg-brand-600 group-hover:text-white transition-colors">
            <QrCode className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-slate-800">Scan QR</span>
          <span className="text-[10px] text-slate-400 mt-0.5">Camera check-in</span>
        </Link>

        <Link
          href="/participant/gps"
          className="bg-white rounded-2xl border border-slate-200 p-4 text-center hover:border-emerald-500 hover:shadow-sm transition-all flex flex-col items-center justify-center group"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <MapPin className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-slate-800">GPS Check-in</span>
          <span className="text-[10px] text-slate-400 mt-0.5">Location radius</span>
        </Link>

        <Link
          href="/participant/pin"
          className="bg-white rounded-2xl border border-slate-200 p-4 text-center hover:border-amber-500 hover:shadow-sm transition-all flex flex-col items-center justify-center group"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2 group-hover:bg-amber-600 group-hover:text-white transition-colors">
            <KeyRound className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-slate-800">Enter PIN</span>
          <span className="text-[10px] text-slate-400 mt-0.5">6-digit code</span>
        </Link>
      </div>

      {/* Live Available Sessions Needing Check-in */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Active Attendance Sessions Open Now</span>
            </h3>
            <p className="text-xs text-slate-500">Live sessions accepting check-ins for your groups</p>
          </div>
        </div>

        <div className="mt-4">
          {activeSessions.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No attendance sessions currently active for your enrolled groups.
            </p>
          ) : (
            <div className="space-y-3">
              {activeSessions.map((sess) => (
                <div
                  key={sess.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-brand-400 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                      {sess.group_name}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm mt-1">{sess.title}</h4>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{sess.session_date}</span>
                      <span>•</span>
                      <span className="capitalize font-semibold text-brand-700">
                        Method: {sess.attendance_method.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {sess.attendance_method === 'qr_code' && (
                      <Link
                        href="/participant/scan"
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>Scan QR</span>
                      </Link>
                    )}
                    {sess.attendance_method === 'gps' && (
                      <Link
                        href={`/participant/gps?session=${sess.id}`}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5"
                      >
                        <MapPin className="w-4 h-4" />
                        <span>Check In via GPS</span>
                      </Link>
                    )}
                    {sess.attendance_method === 'pin' && (
                      <Link
                        href={`/participant/pin?session=${sess.id}`}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5"
                      >
                        <KeyRound className="w-4 h-4" />
                        <span>Enter PIN</span>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Personal Attendance Log */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Attendance Submissions</h3>
            <p className="text-xs text-slate-500">Your verified presence records</p>
          </div>
          <Link
            href="/participant/history"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>Full History</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="mt-4">
          {recentRecords.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No attendance recorded yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentRecords.slice(0, 5).map((rec) => (
                <div key={rec.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Session Record
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{new Date(rec.recorded_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="capitalize">{rec.method_used?.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <Badge status={rec.status} size="sm" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

