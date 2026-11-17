"use client";

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ParticipantProfile } from '@/lib/types';
import { LoadingSpinner, EmptyState } from '@/components/EmptyState';
import { Users, Search, Phone, Mail, GraduationCap, Building2 } from 'lucide-react';

export default function ParticipantsDirectoryPage() {
  const [participants, setParticipants] = useState<ParticipantProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchParticipants();
  }, []);

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/participants/taker-list/');
      const list = res.results || res.data || res;
      setParticipants(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = participants.filter(p =>
    p.user?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.identifier?.toLowerCase().includes(search.toLowerCase()) ||
    p.department?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Participants Directory</h1>
        <p className="text-xs text-slate-500 mt-1">
          Master roster of all students and members enrolled across your attendance groups
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, student ID, department, or email..."
          className="w-full text-xs text-slate-800 placeholder-slate-400 bg-transparent outline-none"
        />
      </div>

      {loading ? (
        <LoadingSpinner text="Loading participants..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8" />}
          title="No Participants Found"
          description="Participants will appear here once they enroll in your groups via QR code or invite link."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Participant</th>
                  <th className="px-6 py-3.5">Student / Badge ID</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5">Contact</th>
                  <th className="px-6 py-3.5">Gender</th>
                  <th className="px-6 py-3.5">NFC Card UID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{item.user?.full_name}</div>
                      <div className="text-[11px] text-slate-500">{item.user?.email}</div>
                    </td>

                    <td className="px-6 py-4 font-mono font-semibold text-slate-800">
                      {item.identifier || <span className="text-slate-400 font-normal">Not Set</span>}
                    </td>

                    <td className="px-6 py-4 text-slate-700">
                      {item.department || <span className="text-slate-400">Not Set</span>}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.user?.phone_number || 'N/A'}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 capitalize text-slate-700">
                      {item.gender?.replace('_', ' ')}
                    </td>

                    <td className="px-6 py-4 font-mono text-[11px] text-slate-500">
                      {item.nfc_card_uid ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {item.nfc_card_uid}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
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

