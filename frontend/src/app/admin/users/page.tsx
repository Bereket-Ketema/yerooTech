"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Badge } from '@/components/Badge';
import { LoadingSpinner, EmptyState } from '@/components/EmptyState';
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  Ban,
  RotateCcw,
  ArrowLeft,
  Mail,
  Phone
} from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let query = '';
      if (roleFilter) query += `role=${roleFilter}&`;
      if (statusFilter) query += `account_status=${statusFilter}&`;

      const res: any = await api.get(`/platform/users/?${query}`);
      const list = res.results || res.data || res;
      setUsers(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId: string, action: 'suspend' | 'reactivate' | 'approve' | 'reject') => {
    try {
      await api.post(`/platform/users/${userId}/action/`, { action });
      fetchUsers();
    } catch (e: any) {
      alert(e.message || 'Action failed');
    }
  };

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Admin Overview</span>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform Users Directory</h1>
        <p className="text-xs text-slate-500 mt-1">
          Master registry of all attendance takers, participants, and administrators
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-transparent outline-none text-slate-800 placeholder-slate-400"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium outline-none"
        >
          <option value="">All Roles</option>
          <option value="attendance_taker">Attendance Takers</option>
          <option value="participant">Participants</option>
          <option value="platform_admin">Platform Administrators</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium outline-none"
        >
          <option value="">All Account Statuses</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Users Table */}
      {loading ? (
        <LoadingSpinner text="Loading users..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8" />}
          title="No Users Found"
          description="Try adjusting your role or account status filters."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Account Status</th>
                  <th className="px-6 py-3.5">Contact</th>
                  <th className="px-6 py-3.5">Date Joined</th>
                  <th className="px-6 py-3.5 text-right">Administrative Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{u.full_name}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>

                    <td className="px-6 py-4">
                      <Badge status={u.role} size="sm" />
                    </td>

                    <td className="px-6 py-4">
                      <Badge status={u.account_status} size="sm" />
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      <span>{u.phone_number || 'N/A'}</span>
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {new Date(u.date_joined).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4 text-right">
                      {u.role !== 'platform_admin' && (
                        <div className="flex items-center justify-end gap-1.5">
                          {u.account_status === 'pending' && (
                            <button
                              onClick={() => handleAction(u.id, 'approve')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-[11px] transition-colors"
                            >
                              Approve
                            </button>
                          )}

                          {u.account_status === 'approved' && (
                            <button
                              onClick={() => handleAction(u.id, 'suspend')}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold text-[11px] transition-colors"
                            >
                              Suspend
                            </button>
                          )}

                          {u.account_status === 'suspended' && (
                            <button
                              onClick={() => handleAction(u.id, 'reactivate')}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-[11px] transition-colors"
                            >
                              Reactivate
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

