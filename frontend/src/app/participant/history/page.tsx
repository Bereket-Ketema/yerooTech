"use client";

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { AttendanceRecord } from '@/lib/types';
import { Badge } from '@/components/Badge';
import { LoadingSpinner, EmptyState } from '@/components/EmptyState';
import { CalendarCheck, Search, Filter, Clock, MapPin, QrCode, KeyRound, Users } from 'lucide-react';

export default function ParticipantHistoryPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/attendance/participant/history/');
      const list = res.results || res.data || res;
      setRecords(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = records.filter(r => {
    const matchesSearch = !search ||
      r.status?.toLowerCase().includes(search.toLowerCase()) ||
      r.method_used?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Attendance History</h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete verified log of your attendance submissions across all sessions
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search records..."
            className="w-full bg-transparent outline-none text-slate-800 placeholder-slate-400"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium outline-none"
        >
          <option value="">All Statuses</option>
          <option value="present">Present</option>
          <option value="late">Late</option>
          <option value="absent">Absent</option>
          <option value="excused">Excused</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading attendance history..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck className="w-8 h-8" />}
          title="No Attendance History Found"
          description="Your attendance records will be permanently cataloged here after submitting check-ins."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Submission Timestamp</th>
                  <th className="px-6 py-3.5">Attendance Status</th>
                  <th className="px-6 py-3.5">Verification Method</th>
                  <th className="px-6 py-3.5">Audit Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">
                        {new Date(rec.recorded_at).toLocaleDateString()}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(rec.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <Badge status={rec.status} size="sm" />
                    </td>

                    <td className="px-6 py-4 text-slate-700 capitalize flex items-center gap-1.5">
                      {rec.method_used === 'qr_code' && <QrCode className="w-3.5 h-3.5 text-brand-600" />}
                      {rec.method_used === 'gps' && <MapPin className="w-3.5 h-3.5 text-emerald-600" />}
                      {rec.method_used === 'pin' && <KeyRound className="w-3.5 h-3.5 text-amber-600" />}
                      {rec.method_used === 'manual' && <Users className="w-3.5 h-3.5 text-purple-600" />}
                      <span>{rec.method_used?.replace('_', ' ')}</span>
                    </td>

                    <td className="px-6 py-4 text-slate-500">
                      {rec.is_manually_modified ? (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-medium border border-amber-200">
                          {rec.modification_reason || 'Manually updated by instructor'}
                        </span>
                      ) : rec.gps_distance_meters ? (
                        <span className="text-emerald-700 text-[11px]">
                          Verified at distance {rec.gps_distance_meters.toFixed(0)}m
                        </span>
                      ) : (
                        <span>Verified</span>
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

