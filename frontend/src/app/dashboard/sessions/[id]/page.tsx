"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { AttendanceSession, AttendanceRecord, GroupMember } from '@/lib/types';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { LoadingSpinner, EmptyState } from '@/components/EmptyState';
import {
  CalendarCheck,
  ArrowLeft,
  Play,
  Pause,
  StopCircle,
  XCircle,
  QrCode,
  RotateCw,
  KeyRound,
  MapPin,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Edit,
  History,
  ShieldCheck,
  Maximize2
} from 'lucide-react';

export default function SessionLiveDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Live QR state
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [qrExpiry, setQrExpiry] = useState<string | null>(null);
  const [refreshingQr, setRefreshingQr] = useState(false);

  // Manual Edit Record Modal state
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [editStatus, setEditStatus] = useState<'present' | 'absent' | 'late' | 'excused'>('present');
  const [editReason, setEditReason] = useState('');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (id) {
      fetchSessionData();
    }
  }, [id]);

  // Periodic polling for real-time incoming attendance records
  useEffect(() => {
    if (!id || !session || session.status !== 'active') return;
    const interval = setInterval(() => {
      fetchRecordsOnly();
    }, 5000);
    return () => clearInterval(interval);
  }, [id, session?.status]);

  const fetchSessionData = async () => {
    try {
      setLoading(true);
      const res: any = await api.get(`/attendance/sessions/${id}/`);
      const sessData: AttendanceSession = res.data || res;
      setSession(sessData);

      // Fetch records & group members
      const [recRes, memRes]: any = await Promise.all([
        api.get(`/attendance/sessions/${id}/records/`),
        api.get(`/groups/${sessData.group}/members/`),
      ]);

      setRecords(recRes.data || []);
      setMembers(memRes.data || []);

      if (sessData.status === 'active' && sessData.attendance_method === 'qr_code') {
        fetchQrCode();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecordsOnly = async () => {
    try {
      const recRes: any = await api.get(`/attendance/sessions/${id}/records/`);
      setRecords(recRes.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchQrCode = async () => {
    try {
      const qrRes: any = await api.get(`/attendance/sessions/${id}/qr_code/`);
      if (qrRes.data) {
        setQrBase64(qrRes.data.qr_code);
        setQrExpiry(qrRes.data.expires_at);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartSession = async () => {
    try {
      const res: any = await api.post(`/attendance/sessions/${id}/start/`);
      setSession(res.data);
      if (res.data.attendance_method === 'qr_code') {
        fetchQrCode();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCloseSession = async () => {
    if (confirm('Are you sure you want to close attendance for this session?')) {
      try {
        const res: any = await api.post(`/attendance/sessions/${id}/close/`);
        setSession(res.data);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleCancelSession = async () => {
    if (confirm('Are you sure you want to cancel this attendance session?')) {
      try {
        await api.post(`/attendance/sessions/${id}/cancel/`);
        fetchSessionData();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleRefreshQr = async () => {
    try {
      setRefreshingQr(true);
      const res: any = await api.post(`/attendance/sessions/${id}/refresh_qr/`);
      if (res.data) {
        setQrBase64(res.data.qr_code);
        setQrExpiry(res.data.expires_at);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshingQr(false);
    }
  };

  const handleSingleManualMark = async (participantId: string, statusVal: string) => {
    try {
      await api.post(`/attendance/sessions/${id}/manual_attendance/`, {
        participant_id: participantId,
        status: statusVal,
        reason: 'Marked manually by taker from roster',
      });
      fetchRecordsOnly();
    } catch (e: any) {
      alert(e.message || 'Error marking attendance');
    }
  };

  const handleBulkMarkAll = async (statusVal: string) => {
    if (confirm(`Mark all ${members.length} participants as ${statusVal.toUpperCase()}?`)) {
      try {
        const entries = members.map(m => ({
          participant_id: m.participant.id,
          status: statusVal,
          reason: `Bulk marked as ${statusVal}`,
        }));
        await api.post(`/attendance/sessions/${id}/bulk_manual/`, { records: entries });
        fetchRecordsOnly();
      } catch (e: any) {
        alert(e.message || 'Error in bulk marking');
      }
    }
  };

  const handleOpenEditModal = (rec: AttendanceRecord) => {
    setSelectedRecord(rec);
    setEditStatus(rec.status as any);
    setEditReason('');
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    if (!editReason.trim()) {
      alert('An audit reason is required when modifying attendance records.');
      return;
    }

    try {
      setSavingEdit(true);
      await api.patch(`/attendance/record/${selectedRecord.id}/modify/`, {
        status: editStatus,
        reason: editReason,
      });
      setIsEditOpen(false);
      fetchRecordsOnly();
    } catch (e: any) {
      alert(e.message || 'Failed to update record');
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) return <LoadingSpinner text="Connecting to live session..." />;
  if (!session) return <div className="text-center py-12 text-sm text-slate-500">Session not found.</div>;

  // Map participant to record
  const recordsMap = new Map<string, AttendanceRecord>();
  records.forEach((r) => {
    recordsMap.set(r.participant, r);
  });

  const presentCount = records.filter(r => r.status === 'present').length;
  const lateCount = records.filter(r => r.status === 'late').length;
  const excusedCount = records.filter(r => r.status === 'excused').length;
  const absentCount = records.filter(r => r.status === 'absent').length;

  const filteredMembers = members.filter(m =>
    m.participant?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.participant?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/sessions"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sessions</span>
        </Link>
      </div>

      {/* Main Session Control Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {session.group_name}
              </span>
              <Badge status={session.status} size="sm" />
              {session.status === 'active' && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live
                </span>
              )}
            </div>

            <h1 className="text-2xl font-black text-slate-900">{session.title}</h1>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              {session.description || 'Attendance session for ' + session.group_name}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {session.status === 'scheduled' && (
              <button
                onClick={handleStartSession}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start Attendance</span>
              </button>
            )}

            {session.status === 'active' && (
              <>
                <button
                  onClick={handleCloseSession}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <StopCircle className="w-4 h-4" />
                  <span>Close Session</span>
                </button>
                <button
                  onClick={handleCancelSession}
                  className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </>
            )}

            {session.status === 'closed' && (
              <button
                onClick={handleStartSession}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100"
              >
                Reopen Session
              </button>
            )}
          </div>
        </div>

        {/* Live Counters */}
        <div className="pt-4 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Roster</span>
            <span className="text-lg font-bold text-slate-900">{members.length}</span>
          </div>
          <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">Present</span>
            <span className="text-lg font-bold text-emerald-700">{presentCount}</span>
          </div>
          <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100">
            <span className="text-[10px] uppercase font-bold text-amber-700 block">Late</span>
            <span className="text-lg font-bold text-amber-700">{lateCount}</span>
          </div>
          <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100">
            <span className="text-[10px] uppercase font-bold text-blue-700 block">Excused</span>
            <span className="text-lg font-bold text-blue-700">{excusedCount}</span>
          </div>
          <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-100">
            <span className="text-[10px] uppercase font-bold text-rose-700 block">Absent</span>
            <span className="text-lg font-bold text-rose-700">{absentCount}</span>
          </div>
        </div>
      </div>

      {/* Primary Verification Method Display */}
      {session.status === 'active' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          {session.attendance_method === 'qr_code' && (
            <div className="text-center max-w-md mx-auto space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <QrCode className="w-4 h-4 text-brand-600" />
                  <span>Dynamic Session QR Code</span>
                </div>
                <button
                  onClick={handleRefreshQr}
                  disabled={refreshingQr}
                  className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1 disabled:opacity-50"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${refreshingQr ? 'animate-spin' : ''}`} />
                  <span>Regenerate Token</span>
                </button>
              </div>

              {qrBase64 ? (
                <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 inline-block shadow-sm">
                  <img
                    src={`data:image/png;base64,${qrBase64}`}
                    alt="Active Session QR"
                    className="w-64 h-64 mx-auto object-contain"
                  />
                </div>
              ) : (
                <div className="py-8">
                  <LoadingSpinner text="Generating dynamic QR..." />
                </div>
              )}

              <p className="text-xs text-slate-500">
                Participants must open their portal and scan this QR code with their mobile phone.
                {session.allow_gps_verification && (
                  <span className="block mt-1 text-emerald-700 font-semibold">
                    GPS Geofence active: submissions verified within {session.gps_radius_meters}m.
                  </span>
                )}
              </p>
            </div>
          )}

          {session.attendance_method === 'pin' && (
            <div className="text-center max-w-sm mx-auto py-4 space-y-3">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-700">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <span>Temporary Session PIN</span>
              </div>

              <div className="py-4 px-6 bg-amber-50 rounded-2xl border-2 border-amber-200 inline-block">
                <span className="text-4xl font-mono font-black tracking-widest text-amber-900">
                  {session.pin_code || '------'}
                </span>
              </div>

              <p className="text-xs text-slate-500">
                Announce this 6-digit PIN to participants to submit their attendance directly from their portal.
              </p>
            </div>
          )}

          {session.attendance_method === 'gps' && (
            <div className="text-center max-w-md mx-auto py-3 space-y-2">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-700">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>GPS Location Verification Active</span>
              </div>
              <p className="text-xs text-slate-600">
                Center: <strong className="font-mono">{session.gps_latitude?.toFixed(4)}, {session.gps_longitude?.toFixed(4)}</strong> | Permitted Radius: <strong>{session.gps_radius_meters} meters</strong>
              </p>
              <p className="text-[11px] text-slate-400">
                Participants click "Submit GPS Location" on their mobile device to record presence.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Live Roster Table & Modification Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Session Roster & Real-Time Log</h3>
            <p className="text-xs text-slate-500">
              Live submissions update automatically. Use buttons to modify records manually.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search attendee..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleBulkMarkAll('present')}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition-colors"
                title="Mark all participants as present"
              >
                All Present
              </button>
              <button
                onClick={() => handleBulkMarkAll('absent')}
                className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors"
                title="Mark all participants as absent"
              >
                All Absent
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Participant</th>
                <th className="px-6 py-3.5">Recorded Status</th>
                <th className="px-6 py-3.5">Method</th>
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5">Audit / Note</th>
                <th className="px-6 py-3.5 text-right">Quick Mark / Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map((member) => {
                const rec = recordsMap.get(member.participant.id);
                const currentStatus = rec ? rec.status : 'unmarked';

                return (
                  <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{member.participant?.full_name}</div>
                      <div className="text-[11px] text-slate-500">{member.participant?.email}</div>
                    </td>

                    <td className="px-6 py-4">
                      {rec ? (
                        <Badge status={rec.status} size="sm" />
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                          Unmarked
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {rec ? (
                        <span className="capitalize">{rec.method_used?.replace('_', ' ')}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {rec && rec.recorded_at ? (
                        <span>{new Date(rec.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {rec?.is_manually_modified ? (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-medium border border-amber-200" title={rec.modification_reason}>
                          Modified Manually
                        </span>
                      ) : rec?.gps_distance_meters ? (
                        <span className="text-emerald-700 text-[11px]">
                          Dist: {rec.gps_distance_meters.toFixed(0)}m
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleSingleManualMark(member.participant.id, 'present')}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 font-semibold text-[11px] transition-colors"
                        >
                          Present
                        </button>
                        <button
                          onClick={() => handleSingleManualMark(member.participant.id, 'late')}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-amber-50 hover:text-amber-700 font-semibold text-[11px] transition-colors"
                        >
                          Late
                        </button>
                        <button
                          onClick={() => handleSingleManualMark(member.participant.id, 'absent')}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-rose-50 hover:text-rose-700 font-semibold text-[11px] transition-colors"
                        >
                          Absent
                        </button>

                        {rec && (
                          <button
                            onClick={() => handleOpenEditModal(rec)}
                            className="p-1 rounded text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors ml-1"
                            title="Edit with Audit Reason"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Override Audit Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Modify Attendance Record (Audit Log)"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <p className="text-xs text-slate-500">
            Modifying an attendance record requires specifying an official reason. All modifications are permanently recorded in the system audit trail.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Participant
            </label>
            <input
              type="text"
              readOnly
              value={selectedRecord?.participant_name || ''}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              New Attendance Status
            </label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white font-medium"
            >
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="excused">Excused</option>
              <option value="absent">Absent</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Modification Reason (Required for Audit) *
            </label>
            <textarea
              required
              rows={3}
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              placeholder="e.g. Student presented valid medical certificate, or scanner hardware glitch"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingEdit}
              className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {savingEdit ? 'Saving...' : 'Commit Record Change'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

