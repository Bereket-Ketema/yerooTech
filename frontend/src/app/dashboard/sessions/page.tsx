"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { AttendanceSession, AttendanceGroup } from '@/lib/types';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { LoadingSpinner, EmptyState } from '@/components/EmptyState';
import {
  CalendarCheck,
  Plus,
  QrCode,
  MapPin,
  KeyRound,
  Users,
  Search,
  Filter,
  ArrowRight,
  Clock,
  Compass
} from 'lucide-react';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [groups, setGroups] = useState<AttendanceGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [search, setSearch] = useState('');

  // Create Session Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    group: '',
    title: '',
    description: '',
    session_date: new Date().toISOString().split('T')[0],
    attendance_method: 'qr_code',
    gps_latitude: '',
    gps_longitude: '',
    gps_radius_meters: 100,
    late_threshold_minutes: 15,
    allow_gps_verification: false,
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, [statusFilter, groupFilter]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      let query = '';
      if (statusFilter) query += `status=${statusFilter}&`;
      if (groupFilter) query += `group=${groupFilter}&`;

      const [sessRes, grpRes]: any = await Promise.all([
        api.get(`/attendance/sessions/?${query}`),
        api.get('/groups/'),
      ]);

      const sessList = sessRes.results || sessRes.data || sessRes;
      const grpList = grpRes.results || grpRes.data || grpRes;

      setSessions(Array.isArray(sessList) ? sessList : []);
      setGroups(Array.isArray(grpList) ? grpList : []);

      if (Array.isArray(grpList) && grpList.length > 0 && !createForm.group) {
        setCreateForm(prev => ({ ...prev, group: grpList[0].id }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCreateForm(prev => ({
            ...prev,
            gps_latitude: pos.coords.latitude.toFixed(6),
            gps_longitude: pos.coords.longitude.toFixed(6),
          }));
        },
        (err) => {
          alert('Could not detect location. Please check browser permissions: ' + err.message);
        }
      );
    } else {
      alert('Geolocation API is not supported by your browser.');
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);

    try {
      const payload: any = {
        group: createForm.group,
        title: createForm.title,
        description: createForm.description,
        session_date: createForm.session_date,
        attendance_method: createForm.attendance_method,
        late_threshold_minutes: Number(createForm.late_threshold_minutes),
        allow_gps_verification: createForm.allow_gps_verification || createForm.attendance_method === 'gps',
      };

      if (createForm.gps_latitude && createForm.gps_longitude) {
        payload.gps_latitude = parseFloat(createForm.gps_latitude);
        payload.gps_longitude = parseFloat(createForm.gps_longitude);
        payload.gps_radius_meters = Number(createForm.gps_radius_meters);
      }

      await api.post('/attendance/sessions/', payload);
      setIsCreateOpen(false);
      fetchInitialData();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create session');
    } finally {
      setCreating(false);
    }
  };

  const filteredSessions = sessions.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.group_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Attendance Sessions</h1>
          <p className="text-xs text-slate-500 mt-1">
            Conduct live attendance taking, monitor arrivals in real-time, and view logs
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Session</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sessions by title or group..."
            className="w-full bg-transparent outline-none text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium outline-none"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="scheduled">Scheduled</option>
            <option value="closed">Closed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium outline-none"
          >
            <option value="">All Groups</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Sessions Grid */}
      {loading ? (
        <LoadingSpinner text="Loading sessions..." />
      ) : filteredSessions.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck className="w-8 h-8" />}
          title="No Attendance Sessions Found"
          description="Create your first session to generate QR codes, coordinate geofences, or mark rosters."
          action={
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold"
            >
              <Plus className="w-4 h-4" /> Create Session
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-brand-300 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {session.group_name}
                  </span>
                  <Badge status={session.status} size="sm" />
                </div>

                <h3 className="font-bold text-slate-900 text-base mt-2.5">{session.title}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {session.description || 'No description added.'}
                </p>

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Date:</span>
                    <span className="font-semibold text-slate-800">{session.session_date}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Method:</span>
                    <span className="capitalize font-semibold text-brand-700 flex items-center gap-1">
                      {session.attendance_method === 'qr_code' && <QrCode className="w-3.5 h-3.5 text-brand-600" />}
                      {session.attendance_method === 'gps' && <MapPin className="w-3.5 h-3.5 text-emerald-600" />}
                      {session.attendance_method === 'pin' && <KeyRound className="w-3.5 h-3.5 text-amber-600" />}
                      {session.attendance_method === 'manual' && <Users className="w-3.5 h-3.5 text-purple-600" />}
                      {session.attendance_method.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Attendance Logged:</span>
                    <span className="font-bold text-slate-900">{session.total_records} records</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {session.status === 'active' ? (
                    <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Now
                    </span>
                  ) : (
                    <span>Status: {session.status}</span>
                  )}
                </span>

                <Link
                  href={`/dashboard/sessions/${session.id}`}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <span>Open Session</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Session Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Attendance Session"
      >
        <form onSubmit={handleCreateSession} className="space-y-4">
          {createError && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200">
              {createError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Group *
            </label>
            <select
              required
              value={createForm.group}
              onChange={(e) => setCreateForm({ ...createForm, group: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name} ({g.unique_code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Session Title *
            </label>
            <input
              type="text"
              required
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              placeholder="e.g. Lecture 04: Database Normalization"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Attendance Date
              </label>
              <input
                type="date"
                required
                value={createForm.session_date}
                onChange={(e) => setCreateForm({ ...createForm, session_date: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Primary Method
              </label>
              <select
                value={createForm.attendance_method}
                onChange={(e) => setCreateForm({ ...createForm, attendance_method: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white"
              >
                <option value="qr_code">Dynamic QR Code</option>
                <option value="gps">GPS Location</option>
                <option value="pin">Temporary PIN Code</option>
                <option value="manual">Manual Roster</option>
              </select>
            </div>
          </div>

          {/* GPS fields if GPS method or GPS verification enabled */}
          {(createForm.attendance_method === 'gps' || createForm.allow_gps_verification) && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" /> Geofence Configuration
                </span>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 flex items-center gap-1"
                >
                  <Compass className="w-3.5 h-3.5 text-brand-600" />
                  <span>Detect My Location</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={createForm.gps_latitude}
                    onChange={(e) => setCreateForm({ ...createForm, gps_latitude: e.target.value })}
                    placeholder="e.g. 9.0300"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={createForm.gps_longitude}
                    onChange={(e) => setCreateForm({ ...createForm, gps_longitude: e.target.value })}
                    placeholder="e.g. 38.7600"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Radius (m)</label>
                  <input
                    type="number"
                    value={createForm.gps_radius_meters}
                    onChange={(e) => setCreateForm({ ...createForm, gps_radius_meters: parseInt(e.target.value) || 100 })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none bg-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Late Grace Period (Mins)
              </label>
              <input
                type="number"
                value={createForm.late_threshold_minutes}
                onChange={(e) => setCreateForm({ ...createForm, late_threshold_minutes: parseInt(e.target.value) || 15 })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div className="flex items-center pt-5">
              <input
                type="checkbox"
                id="allow_gps"
                checked={createForm.allow_gps_verification}
                onChange={(e) => setCreateForm({ ...createForm, allow_gps_verification: e.target.checked })}
                className="rounded text-brand-600 focus:ring-brand-500"
              />
              <label htmlFor="allow_gps" className="ml-2 text-xs text-slate-700 font-medium">
                Enforce GPS check on QR
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {creating ? 'Saving...' : 'Create Session'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

