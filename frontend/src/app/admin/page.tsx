"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/Badge';
import { LoadingSpinner } from '@/components/EmptyState';
import {
  ShieldCheck,
  UserCheck,
  Users,
  Layers,
  CalendarCheck,
  Clock,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, pendingRes]: any = await Promise.all([
        api.get('/platform/dashboard/'),
        api.get('/platform/pending/'),
      ]);
      setStats(statsRes.data);
      const list = pendingRes.results || pendingRes.data || pendingRes;
      setPendingUsers(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (userId: string, action: 'approve' | 'reject') => {
    try {
      await api.post(`/platform/users/${userId}/action/`, { action });
      fetchAdminData();
    } catch (e: any) {
      alert(e.message || 'Action failed');
    }
  };

  if (loading) return <LoadingSpinner text="Loading platform administration metrics..." />;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-semibold mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
          <span>Platform Administrator Control Center</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          System Overview & Tenant Governance
        </h1>
        <p className="mt-1 text-xs text-slate-500 max-w-xl">
          Review pending attendance taker registrations, govern multi-tenant organizations, and inspect system volume.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Attendance Takers"
          value={stats?.total_attendance_takers || 0}
          subtitle={`${stats?.approved_accounts || 0} approved`}
          icon={<ShieldCheck className="w-5 h-5" />}
          color="brand"
        />
        <StatCard
          title="Pending Approvals"
          value={stats?.pending_registrations || 0}
          subtitle="Awaiting admin action"
          icon={<Clock className="w-5 h-5" />}
          color="amber"
        />
        <StatCard
          title="Total Participants"
          value={stats?.total_participants || 0}
          subtitle="Enrolled students & attendees"
          icon={<Users className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard
          title="Platform Sessions"
          value={stats?.total_sessions || 0}
          subtitle={`${stats?.total_groups || 0} attendance groups`}
          icon={<CalendarCheck className="w-5 h-5" />}
          color="slate"
        />
      </div>

      {/* Pending Approval Priority Queue */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Pending Attendance Taker Registrations ({pendingUsers.length})</span>
            </h3>
            <p className="text-xs text-slate-500">
              New teachers, managers, and instructors awaiting approval before conducting attendance
            </p>
          </div>
          <Link
            href="/admin/pending"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>Manage All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="mt-4">
          {pendingUsers.length === 0 ? (
            <div className="py-8 text-center text-xs text-emerald-600 font-semibold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>All attendance taker applications have been reviewed. Queue is clear!</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingUsers.slice(0, 5).map((u) => (
                <div key={u.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{u.full_name}</span>
                      <span className="text-xs text-slate-500">({u.email})</span>
                      <Badge status={u.account_status} size="sm" />
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Organization: <strong>{u.tenant_profile?.organization_name || 'Individual'}</strong> • Registered: {new Date(u.date_joined).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQuickAction(u.id, 'approve')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
                    >
                      Approve Account
                    </button>
                    <button
                      onClick={() => handleQuickAction(u.id, 'reject')}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-xs font-semibold transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

