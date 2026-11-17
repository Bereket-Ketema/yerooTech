"use client";

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { AttendanceGroup } from '@/lib/types';
import { StatCard } from '@/components/StatCard';
import { LoadingSpinner } from '@/components/EmptyState';
import {
  FileBarChart,
  Download,
  Calendar,
  Filter,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  FileSpreadsheet,
  FileText
} from 'lucide-react';

export default function ReportsPage() {
  const [groups, setGroups] = useState<AttendanceGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    fetchGroups();
    fetchAnalytics();
  }, []);

  const fetchGroups = async () => {
    try {
      const res: any = await api.get('/groups/');
      const list = res.results || res.data || res;
      setGroups(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      let query = '';
      if (selectedGroup) query += `group_id=${selectedGroup}&`;
      if (startDate) query += `start_date=${startDate}&`;
      if (endDate) query += `end_date=${endDate}&`;

      const res: any = await api.get(`/reports/summary/?${query}`);
      setSummary(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      setExporting(format);
      let query = '';
      if (selectedGroup) query += `group_id=${selectedGroup}&`;

      const blob: any = await api.get(`/reports/export/${format}/?${query}`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_report_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (e: any) {
      alert(`Failed to export ${format.toUpperCase()} report: ` + e.message);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-xs text-slate-500 mt-1">
            Aggregate attendance rates, identify frequent absentees, and export compliance documents
          </p>
        </div>

        {/* 1-Click Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            disabled={!!exporting}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV Log</span>
          </button>

          <button
            onClick={() => handleExport('excel')}
            disabled={!!exporting}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => handleExport('pdf')}
            disabled={!!exporting}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF Summary</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700">Filter By:</span>
        </div>

        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium outline-none"
        >
          <option value="">All Attendance Groups</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">From</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none"
          />
          <span className="text-xs text-slate-400">To</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none"
          />
        </div>

        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors ml-auto"
        >
          Apply Filters
        </button>
      </div>

      {/* KPI Metrics */}
      {loading ? (
        <LoadingSpinner text="Calculating attendance summaries..." />
      ) : summary ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Attendance Rate"
              value={`${summary.attendance_percentage}%`}
              subtitle="Present & late ratio"
              icon={<CheckCircle2 className="w-5 h-5" />}
              color="emerald"
            />
            <StatCard
              title="Total Sessions"
              value={summary.total_sessions}
              subtitle="Analyzed in date range"
              icon={<Calendar className="w-5 h-5" />}
              color="brand"
            />
            <StatCard
              title="Total Recorded Entries"
              value={summary.total_records}
              subtitle={`${summary.present_count} present, ${summary.late_count} late`}
              icon={<FileBarChart className="w-5 h-5" />}
              color="amber"
            />
            <StatCard
              title="Total Absences"
              value={summary.absent_count}
              subtitle={`${summary.excused_count} excused records`}
              icon={<XCircle className="w-5 h-5" />}
              color="rose"
            />
          </div>

          {/* Breakdown & Absentees Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Method Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-1">Attendance Method Breakdown</h3>
              <p className="text-xs text-slate-500 mb-4">Distribution of check-in methods used by participants</p>

              {summary.method_breakdown?.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No record logs to display</p>
              ) : (
                <div className="space-y-3">
                  {summary.method_breakdown?.map((item: any) => {
                    const pct = summary.total_records > 0
                      ? Math.round((item.count / summary.total_records) * 100)
                      : 0;
                    return (
                      <div key={item.method_used} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="capitalize text-slate-700">{item.method_used.replace('_', ' ')}</span>
                          <span className="text-slate-500">{item.count} records ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-600 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Frequent Absentees */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-1">Frequently Absent Attendees</h3>
              <p className="text-xs text-slate-500 mb-4">Participants with the highest number of recorded absences</p>

              {summary.frequent_absentees?.length === 0 ? (
                <div className="py-8 text-center text-xs text-emerald-600 font-semibold flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Excellent! No frequent absentees detected in this period.</span>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {summary.frequent_absentees?.map((abs: any) => (
                    <div key={abs.participant_id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          {abs.participant__first_name} {abs.participant__last_name}
                        </div>
                        <div className="text-[11px] text-slate-400">{abs.participant__email}</div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        {abs.absent_count} Absences
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

