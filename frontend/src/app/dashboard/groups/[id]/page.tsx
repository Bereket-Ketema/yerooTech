"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { AttendanceGroup, GroupMember } from '@/lib/types';
import { Badge } from '@/components/Badge';
import { LoadingSpinner, EmptyState } from '@/components/EmptyState';
import {
  Layers,
  Users,
  ArrowLeft,
  CalendarCheck,
  UserX,
  Search,
  Plus,
  Mail,
  Phone,
  Clock
} from 'lucide-react';

export default function GroupDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [group, setGroup] = useState<AttendanceGroup | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (id) {
      fetchGroupData();
    }
  }, [id]);

  const fetchGroupData = async () => {
    try {
      setLoading(true);
      const [groupRes, membersRes]: any = await Promise.all([
        api.get(`/groups/${id}/`),
        api.get(`/groups/${id}/members/`),
      ]);
      setGroup(groupRes.data || groupRes);
      setMembers(membersRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (participantId: string, memberName: string) => {
    if (confirm(`Are you sure you want to remove ${memberName} from this group?`)) {
      try {
        await api.post(`/groups/${id}/remove_member/`, { participant_id: participantId });
        fetchGroupData();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const filteredMembers = members.filter((m) =>
    m.participant?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.participant?.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner text="Loading group details and roster..." />;
  if (!group) return <div className="text-center py-12 text-sm text-slate-500">Group not found.</div>;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/groups"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Groups</span>
        </Link>
      </div>

      {/* Group Card Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                {group.category}
              </span>
              <Badge status={group.status} size="sm" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">{group.name}</h1>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              {group.description || 'No description added.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/sessions?group=${group.id}`}
              className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Launch Session for this Group</span>
            </Link>
          </div>
        </div>

        <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 font-medium block">Unique Join Code</span>
            <span className="font-mono font-bold text-slate-900 text-sm">{group.unique_code}</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Enrolled Participants</span>
            <span className="font-bold text-slate-900 text-sm">{members.filter(m => m.status === 'active').length}</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Registration Status</span>
            <span className="font-semibold text-slate-700">{group.registration_open ? 'Open' : 'Closed'}</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Created Date</span>
            <span className="text-slate-700 font-semibold">{new Date(group.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Roster & Participant Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Enrolled Participants ({filteredMembers.length})</h3>
            <p className="text-xs text-slate-500">Students and attendees registered to submit attendance in this group</p>
          </div>

          <div className="w-full sm:w-64">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search roster..."
                className="w-full bg-transparent outline-none text-slate-800 placeholder-slate-400"
              />
            </div>
          </div>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<Users className="w-8 h-8" />}
              title="No Participants Found"
              description="Share the group's registration QR code or join code to enroll participants."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Participant</th>
                  <th className="px-6 py-3.5">Contact</th>
                  <th className="px-6 py-3.5">Enrollment Method</th>
                  <th className="px-6 py-3.5">Joined Date</th>
                  <th className="px-6 py-3.5">Membership Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{member.participant?.full_name}</div>
                      <div className="text-[11px] text-slate-500">{member.participant?.email}</div>
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{member.participant?.phone_number || 'N/A'}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-slate-600 capitalize">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                        {member.joined_via?.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {new Date(member.joined_at).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4">
                      <Badge status={member.status} size="sm" />
                    </td>

                    <td className="px-6 py-4 text-right">
                      {member.status === 'active' && (
                        <button
                          onClick={() => handleRemoveMember(member.participant.id, member.participant.full_name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Remove from group"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

