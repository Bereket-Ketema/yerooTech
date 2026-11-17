"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { AttendanceSession } from '@/lib/types';
import { LoadingSpinner } from '@/components/EmptyState';
import {
  QrCode,
  Camera,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Smartphone,
  Send,
  Compass
} from 'lucide-react';

export default function ParticipantScanPage() {
  const [tokenInput, setTokenInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);
  const [gpsCoords, setGpsCoords] = useState<{ latitude?: number; longitude?: number }>({});
  const [activeSessions, setActiveSessions] = useState<AttendanceSession[]>([]);

  useEffect(() => {
    // Acquire location in background in case session enforces GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        () => {}
      );
    }

    // Fetch active QR sessions for quick select
    api.get<any>('/attendance/participant/active-sessions/')
      .then((res) => {
        const list = res.results || res.data || res;
        if (Array.isArray(list)) {
          setActiveSessions(list.filter(s => s.attendance_method === 'qr_code'));
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmitQr = async (tokenVal?: string) => {
    const codeToSubmit = tokenVal || tokenInput;
    if (!codeToSubmit.trim()) {
      alert('Please enter or scan a valid QR session token.');
      return;
    }

    setSubmitting(true);
    setResult(null);

    try {
      const payload: any = {
        qr_token: codeToSubmit.trim(),
      };
      if (gpsCoords.latitude && gpsCoords.longitude) {
        payload.latitude = gpsCoords.latitude;
        payload.longitude = gpsCoords.longitude;
      }

      const res: any = await api.post('/attendance/submit/qr/', payload);
      setResult({
        success: true,
        message: res.message || 'Attendance submitted successfully!',
        data: res.data,
      });
      setTokenInput('');
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || 'Verification failed. Token may be invalid or expired.',
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

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm text-center">
        <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3">
          <QrCode className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-black text-slate-900">QR Code Attendance Check-In</h1>
        <p className="text-xs text-slate-500 mt-1">
          Scan the active projector QR code displayed by your instructor
        </p>

        {/* Viewfinder simulation / camera container */}
        <div className="mt-6 relative w-full aspect-square bg-slate-900 rounded-2xl overflow-hidden flex flex-col items-center justify-center p-6 text-white border-4 border-slate-800">
          <div className="absolute inset-8 border-2 border-dashed border-brand-400 rounded-xl pointer-events-none animate-pulse" />
          <Camera className="w-12 h-12 text-slate-400 mb-3" />
          <p className="text-xs font-semibold text-slate-300">Aim Camera at Projected QR Code</p>
          <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
            Position QR code inside the box to record attendance
          </p>
        </div>

        {/* Status result alert */}
        {result && (
          <div className={`mt-6 p-4 rounded-xl text-xs flex items-start gap-3 text-left ${
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
              <div className="font-bold">{result.success ? 'Attendance Verified!' : 'Check-in Error'}</div>
              <div className="mt-0.5 text-[11px] leading-relaxed">{result.message}</div>
            </div>
          </div>
        )}

        {/* Manual QR Token Input (fallback for all devices) */}
        <div className="mt-6 pt-6 border-t border-slate-100 text-left">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Manual QR Token / Scan Code
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Paste session token UUID..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none font-mono focus:ring-2 focus:ring-brand-500"
            />
            <button
              onClick={() => handleSubmitQr()}
              disabled={submitting}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Verifying...' : 'Submit'}</span>
            </button>
          </div>
        </div>

        {/* Quick select active session token for immediate test */}
        {activeSessions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 text-left">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
              Fast 1-Click Check-in (Detected Active Sessions)
            </span>
            <div className="space-y-2">
              {activeSessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSubmitQr(s.qr_token)}
                  disabled={submitting}
                  className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 flex items-center justify-between text-left transition-all text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-800">{s.title}</div>
                    <div className="text-[10px] text-slate-400">{s.group_name}</div>
                  </div>
                  <span className="text-[11px] font-semibold text-brand-600">Check In &rarr;</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

