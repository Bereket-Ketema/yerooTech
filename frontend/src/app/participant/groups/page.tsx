"use client";

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { AttendanceGroup } from '@/lib/types';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { LoadingSpinner, EmptyState } from '@/components/EmptyState';
import { GraduationCap, Plus, Search, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export default function ParticipantGroupsPage() {
  const [groups, setGroups] = useState<AttendanceGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Join modal
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinResult, setJoinResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetchMyGroups();
  }, []);

  const fetchMyGroups = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/groups/my-groups/');
      const list = res.results || res.data || res;
      setGroups(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setJoining(true);
    setJoinResult(null);

    try {
      const res: any = await api.post('/groups/join/', {
        unique_code: joinCode.trim(),
      });
      setJoinResult({
        success: true,
        message: res.message || 'Joined group successfully!',
      });
      setJoinCode('');
      fetchMyGroups();
    } catch (err: any) {
      setJoinResult({
        success: false,
        message: err.message || 'Could not join group. Code may be invalid or registration closed.',
      });
    } finally {
      setJoining(false);
    }
  };

  const filtered = groups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.unique_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Enrolled Groups</h1>
          <p className="text-xs text-slate-500 mt-1">
            Classes, departments, and events you have registered for
          </p>
        </div>

        <button
          onClick={() => {
            setJoinResult(null);
            setIsJoinOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Join New Group with Code</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter your enrolled groups..."
          className="w-full text-xs text-slate-800 placeholder-slate-400 bg-transparent outline-none"
        />
      </div>

      {loading ? (
        <LoadingSpinner text="Loading enrolled groups..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="w-8 h-8" />}
          title="Not Enrolled in Any Groups"
          description="Use the group join code or scan an enrollment QR code from your instructor to join."
          action={
            <button
              onClick={() => setIsJoinOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold"
            >
              <Plus className="w-4 h-4" /> Enter Join Code
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {filtered.map((g) => (
            <div
              key={g.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                  {g.category}
                </span>
                <Badge status={g.status} size="sm" />
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-base">{g.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {g.description || 'No description provided.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Code: <strong className="font-mono text-slate-800">{g.unique_code}</strong></span>
                <span>Instructor: {g.owner_name}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Join Group Modal */}
      <Modal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        title="Join Attendance Group"
      >
        <form onSubmit={handleJoinGroup} className="space-y-4">
          <p className="text-xs text-slate-500">
            Enter the unique 8-character code shared by your teacher, manager, or event host.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Group Join Code *
            </label>
            <input
              type="text"
              required
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="e.g. AB12CD34"
              className="w-full px-3 py-2.5 text-sm font-mono uppercase tracking-widest border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-center"
            />
          </div>

          {joinResult && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              joinResult.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {joinResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{joinResult.message}</span>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsJoinOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={joining}
              className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {joining ? 'Enrolling...' : 'Join Group'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

