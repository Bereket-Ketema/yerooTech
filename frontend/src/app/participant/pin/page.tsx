"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { AttendanceSession } from '@/lib/types';
import { LoadingSpinner } from '@/components/EmptyState';
import { KeyRound, ArrowLeft, CheckCircle2, AlertCircle, Send } from 'lucide-react';

function PinContent() {
  const searchParams = useSearchParams();
  const initialSessionId = searchParams.get('session') || '';

  const [activeSessions, setActiveSessions] = useState<AttendanceSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState(initialSessionId);
  const [pinCode, setPinCode] = useState('');
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);

  useEffect(() => {
    fetchActiveSessions();
  }, []);

  const fetchActiveSessions = async () => {
    try {
      setLoadingSessions(true);
      const res: any = await api.get('/attendance/participant/active-sessions/');
      const list = res.results || res.data || res;
      if (Array.isArray(list)) {
        setActiveSessions(list);
        if (!selectedSessionId && list.length > 0) {
          setSelectedSessionId(list[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleSubmitPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionId) {
      alert('Please select an active session.');
      return;
    }
    if (!pinCode.trim()) {
      alert('Please enter the 6-digit session PIN code.');
      return;
    }

    setSubmitting(true);
    setResult(null);

    try {
      const res: any = await api.post('/attendance/submit/pin/', {
        session_id: selectedSessionId,
        pin_code: pinCode.trim(),
      });

      setResult({
        success: true,
        message: res.message || 'Attendance registered with PIN code!',
        data: res.data,
      });
      setPinCode('');
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || 'Invalid or expired PIN code.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/participant"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Portal</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black text-slate-900">Enter Attendance PIN</h1>
          <p className="text-xs text-slate-500 mt-1">
            Input the 6-digit session code provided by your instructor or host
          </p>
        </div>

        <form onSubmit={handleSubmitPin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Attendance Session
            </label>
            {loadingSessions ? (
              <LoadingSpinner text="Checking for active sessions..." />
            ) : activeSessions.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-xl">
                No active sessions currently open.
              </p>
            ) : (
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white font-medium"
              >
                {activeSessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.group_name})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 text-center">
              6-Digit Security PIN
            </label>
            <input
              type="text"
              required
              maxLength={10}
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value)}
              placeholder="0 0 0 0 0 0"
              className="w-full py-3 text-center font-mono text-2xl font-black tracking-widest border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
            />
          </div>

          {result && (
            <div className={`p-4 rounded-xl text-xs flex items-start gap-3 ${
              result.success
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {result.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-bold">{result.success ? 'PIN Accepted!' : 'PIN Error'}</div>
                <div className="mt-0.5 text-[11px] leading-relaxed">{result.message}</div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !selectedSessionId || !pinCode}
            className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? 'Verifying PIN...' : 'Submit PIN Attendance'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ParticipantPinPage() {
  return (
    <Suspense fallback={<LoadingSpinner text="Loading PIN module..." />}>
      <PinContent />
    </Suspense>
  );
}
