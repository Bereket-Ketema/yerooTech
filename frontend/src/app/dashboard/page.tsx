"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { DashboardStats, AttendanceSession } from '@/lib/types';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/Badge';
import { LoadingSpinner, EmptyState } from '@/components/EmptyState';
import {
  Users,
  Layers,
  CalendarCheck,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  ArrowRight,
  QrCode,
  FileBarChart,
  ShieldAlert
} from 'lucide-react';

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSessions, setRecentSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/attendance/dashboard/');
      if (res.data) {
        setStats(res.data.stats);
        setRecentSessions(res.data.recent_sessions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading attendance metrics..." />;
  }

  const isPending = user?.account_status === 'pending';

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold mb-2 border border-brand-200">
            <span>Tenant Workspace: {user?.tenant_profile?.organization_name || 'Individual Attendance Taker'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Welcome back, {user?.first_name}!
          </h1>
          <p className="mt-1 text-sm text-slate-500 max-w-xl">
            Manage your attendance groups, launch real-time QR/GPS attendance sessions, and monitor attendance records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/groups"
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-sm transition-colors flex items-center gap-2"
          >
            <Layers className="w-4 h-4 text-brand-600" />
            <span>Manage Groups</span>
          </Link>
          <Link
            href="/dashboard/sessions"
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Attendance Session</span>
          </Link>
        </div>
      </div>

      {isPending && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 text-amber-900 flex items-start gap-3.5 shadow-sm">
          <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-sm">Account Status: Pending Administrator Approval</h4>
            <p className="mt-1 text-amber-800">
              Your attendance taker account is currently under review by a platform administrator. While in pending status, creating new active sessions and modifying participant logs is restricted. An admin will review and approve your registration shortly.
            </p>
          </div>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Attendance Groups"
          value={stats?.total_groups || 0}
          subtitle={`${stats?.active_groups || 0} currently active`}
          icon={<Layers className="w-5 h-5" />}
          color="brand"
        />
        <StatCard
          title="Registered Participants"
          value={stats?.total_participants || 0}
          subtitle="Enrolled across your groups"
          icon={<Users className="w-5 h-5" />}
          color="slate"
        />
        <StatCard
          title="Total Sessions"
          value={stats?.total_sessions || 0}
          subtitle={`${stats?.today_sessions || 0} scheduled for today`}
          icon={<CalendarCheck className="w-5 h-5" />}
          color="amber"
        />
        <StatCard
          title="Today's Present Attendees"
          value={stats?.today_present || 0}
          subtitle={`${stats?.today_late || 0} late, ${stats?.today_absent || 0} absent`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="emerald"
        />
      </div>

      {/* Attendance Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Sessions */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Attendance Sessions</h3>
              <p className="text-xs text-slate-500">Latest active and completed attendance activities</p>
            </div>
            <Link
              href="/dashboard/sessions"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="mt-4">
            {recentSessions.length === 0 ? (
              <EmptyState
                icon={<CalendarCheck className="w-8 h-8" />}
                title="No Sessions Recorded Yet"
                description="Create your first attendance session to begin taking live attendance via QR or GPS."
                action={
                  <Link
                    href="/dashboard/sessions"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Create Session
                  </Link>
                }
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {recentSessions.map((session) => (
                  <div key={session.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div>
                      <Link
                        href={`/dashboard/sessions/${session.id}`}
                        className="text-sm font-semibold text-slate-900 hover:text-brand-600 transition-colors"
                      >
                        {session.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <span>{session.group_name}</span>
                        <span>•</span>
                        <span>{session.session_date}</span>
                        <span>•</span>
                        <span className="capitalize">{session.attendance_method.replace('_', ' ')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block">
                        <span className="text-xs font-bold text-slate-700">{session.total_records}</span>
                        <span className="text-xs text-slate-400"> attendees</span>
                      </div>
                      <Badge status={session.status} size="sm" />
                      <Link
                        href={`/dashboard/sessions/${session.id}`}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 transition-colors"
                      >
                        Manage
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Attendance Verification Methods & Quick Links */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1">Quick Tools</h3>
            <p className="text-xs text-slate-500 mb-4">Fast shortcuts for attendance taker workflows</p>

            <div className="space-y-2.5">
              <Link
                href="/dashboard/groups"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50/50 transition-all text-xs font-semibold text-slate-700 group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-brand-100 text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-slate-900 font-bold">Group Registration QR</div>
                    <div className="text-[11px] text-slate-500 font-normal">Generate enrollment codes for students</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 transition-colors" />
              </Link>

              <Link
                href="/dashboard/reports"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50/50 transition-all text-xs font-semibold text-slate-700 group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <FileBarChart className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-slate-900 font-bold">Export Attendance Logs</div>
                    <div className="text-[11px] text-slate-500 font-normal">Download PDF, Excel, & CSV reports</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
              </Link>

              <Link
                href="/dashboard/participants"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50/50 transition-all text-xs font-semibold text-slate-700 group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-slate-900 font-bold">Participants Directory</div>
                    <div className="text-[11px] text-slate-500 font-normal">View badge IDs and departments</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

