"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { ParticipantProfile } from '@/lib/types';
import { LoadingSpinner } from '@/components/EmptyState';
import {
  User as UserIcon,
  Phone,
  GraduationCap,
  Save,
  CheckCircle2,
  AlertCircle,
  Radio,
  ShieldCheck
} from 'lucide-react';

export default function ParticipantProfilePage() {
  const { user, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<ParticipantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [department, setDepartment] = useState('');
  const [organization, setOrganization] = useState('');
  const [gender, setGender] = useState('prefer_not_to_say');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/participants/me/');
      const p: ParticipantProfile = res.data || res;
      setProfile(p);
      setFirstName(p.user?.first_name || '');
      setLastName(p.user?.last_name || '');
      setPhoneNumber(p.user?.phone_number || '');
      setIdentifier(p.identifier || '');
      setDepartment(p.department || '');
      setOrganization(p.organization_or_school || '');
      setGender(p.gender || 'prefer_not_to_say');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);

    try {
      await api.put('/participants/me/', {
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        identifier,
        department,
        organization_or_school: organization,
        gender,
      });
      setMessage({ type: 'success', text: 'Participant profile updated successfully!' });
      refreshProfile();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading participant profile..." />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Participant Profile & Digital Badge</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your personal identification, institution department, and verified contact info
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        {message && (
          <div className={`mb-6 p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                First Name
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Last Name
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Student ID / Badge Number
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. UGR/1234/15 or EMP-902"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number (OTP Verified)
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Department / Program
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Software Engineering"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
          </div>

          {/* NFC Hardware UID Indicator */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <Radio className="w-4 h-4 text-brand-600" />
              <div>
                <span className="font-bold text-slate-800">Physical NFC Contactless UID: </span>
                <span className="font-mono text-slate-600">
                  {profile?.nfc_card_uid || 'Unpaired (Tap card on reader to assign)'}
                </span>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-500">
              Future Expansion
            </span>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

