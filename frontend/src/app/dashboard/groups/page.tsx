"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { AttendanceGroup } from '@/lib/types';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { LoadingSpinner, EmptyState } from '@/components/EmptyState';
import {
  Layers,
  Plus,
  QrCode,
  Users,
  Copy,
  Check,
  CalendarCheck,
  ArrowRight,
  Archive,
  ExternalLink,
  Search
} from 'lucide-react';

export default function GroupsPage() {
  const [groups, setGroups] = useState<AttendanceGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    category: 'class',
    description: '',
    registration_open: true,
    max_participants: '',
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // QR / Invite Link Modal state
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<AttendanceGroup | null>(null);
  const [qrData, setQrData] = useState<{ qr_code: string; invite_url: string; unique_code: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [loadingQr, setLoadingQr] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/groups/');
      // Handling pagination if any, or plain list
      const list = res.results || res.data || res;
      setGroups(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);

    try {
      const payload: any = {
        name: createForm.name,
        category: createForm.category,
        description: createForm.description,
        registration_open: createForm.registration_open,
      };
      if (createForm.max_participants) {
        payload.max_participants = parseInt(createForm.max_participants);
      }

      await api.post('/groups/', payload);
      setIsCreateOpen(false);
      setCreateForm({
        name: '',
        category: 'class',
        description: '',
        registration_open: true,
        max_participants: '',
      });
      fetchGroups();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenQrModal = async (group: AttendanceGroup) => {
    setSelectedGroup(group);
    setIsQrOpen(true);
    setLoadingQr(true);
    setCopied(false);
    try {
      const res: any = await api.get(`/groups/${group.id}/registration_qr/`);
      setQrData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingQr(false);
    }
  };

  const handleCopyLink = () => {
    if (qrData?.invite_url) {
      navigator.clipboard.writeText(qrData.invite_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleArchiveGroup = async (groupId: string) => {
    if (confirm('Are you sure you want to archive this attendance group?')) {
      try {
        await api.post(`/groups/${groupId}/archive/`);
        fetchGroups();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.unique_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Attendance Groups</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your classes, departments, teams, and events
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Group</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search groups by name or unique code..."
          className="w-full text-xs text-slate-800 placeholder-slate-400 bg-transparent outline-none"
        />
      </div>

      {/* Groups List */}
      {loading ? (
        <LoadingSpinner text="Loading attendance groups..." />
      ) : filteredGroups.length === 0 ? (
        <EmptyState
          icon={<Layers className="w-8 h-8" />}
          title="No Groups Found"
          description={search ? "No groups match your search filter." : "Create your first attendance group to enroll participants and launch sessions."}
          action={
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold"
            >
              <Plus className="w-4 h-4" /> Create New Group
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-brand-300 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                      {group.category}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base mt-2">{group.name}</h3>
                  </div>
                  <Badge status={group.status} size="sm" />
                </div>

                <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                  {group.description || 'No description provided.'}
                </p>

                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Enrolled</span>
                    <span className="font-bold text-slate-900 text-sm">{group.participant_count}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Sessions</span>
                    <span className="font-bold text-slate-900 text-sm">{group.session_count}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Code: <strong className="text-slate-700">{group.unique_code}</strong></span>
                  <span>{group.registration_open ? 'Open Enrollment' : 'Closed'}</span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenQrModal(group)}
                  className="px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
                  title="Show Enrollment QR Code"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>QR Invite</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleArchiveGroup(group.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    title="Archive Group"
                  >
                    <Archive className="w-4 h-4" />
                  </button>

                  <Link
                    href={`/dashboard/groups/${group.id}`}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <span>Manage</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Attendance Group"
      >
        <form onSubmit={handleCreateGroup} className="space-y-4">
          {createError && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200">
              {createError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Group Name *
            </label>
            <input
              type="text"
              required
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              placeholder="e.g. Software Engineering 401 Section A"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={createForm.category}
                onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white"
              >
                <option value="class">Class</option>
                <option value="department">Department</option>
                <option value="team">Team</option>
                <option value="training">Training Program</option>
                <option value="workshop">Workshop</option>
                <option value="conference">Conference</option>
                <option value="meeting">Meeting</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Max Participants
              </label>
              <input
                type="number"
                value={createForm.max_participants}
                onChange={(e) => setCreateForm({ ...createForm, max_participants: e.target.value })}
                placeholder="Optional limit"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              placeholder="Brief description of the course or team..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="registration_open"
              checked={createForm.registration_open}
              onChange={(e) => setCreateForm({ ...createForm, registration_open: e.target.checked })}
              className="rounded text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="registration_open" className="text-xs text-slate-700 font-medium">
              Open for self-registration via QR code and invite link
            </label>
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
              {creating ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Registration QR & Invite Link Modal */}
      <Modal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        title={`Group Registration - ${selectedGroup?.name || ''}`}
      >
        <div className="text-center py-2">
          <p className="text-xs text-slate-500 mb-4">
            Participants can scan this QR code or use the invitation link below to enroll in this group.
          </p>

          {loadingQr ? (
            <LoadingSpinner text="Generating dynamic QR code..." />
          ) : qrData ? (
            <div className="space-y-5">
              <div className="inline-block p-4 bg-white rounded-2xl border-2 border-slate-100 shadow-sm mx-auto">
                <img
                  src={`data:image/png;base64,${qrData.qr_code}`}
                  alt="Registration QR Code"
                  className="w-56 h-56 mx-auto object-contain"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Unique Group Join Code
                </span>
                <span className="text-sm font-mono font-bold text-slate-800 tracking-wider">
                  {qrData.unique_code}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={qrData.invite_url}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-600 outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-800 transition-colors shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-rose-600">Failed to generate enrollment code.</p>
          )}
        </div>
      </Modal>
    </div>
  );
}

