"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { AttendanceSession } from '@/lib/types';
import { LoadingSpinner } from '@/components/EmptyState';
import {
  MapPin,
  Compass,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Navigation,
  ShieldCheck,
  Send
} from 'lucide-react';

function GpsContent() {
  const searchParams = useSearchParams();
  const initialSessionId = searchParams.get('session') || '';

  const [activeSessions, setActiveSessions] = useState<AttendanceSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState(initialSessionId);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // GPS state
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);

  useEffect(() => {
    fetchActiveSessions();
    acquireLocation();
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

  const acquireLocation = () => {
    setLocError(null);
    setDetectingLocation(true);
    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser.');
      setDetectingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setAccuracy(pos.coords.accuracy);
        setDetectingLocation(false);
      },
      (err) => {
        let msg = 'Could not acquire location.';
        if (err.code === 1) msg = 'Location permission denied. Please allow location access in your browser settings.';
        else if (err.code === 2) msg = 'Location unavailable. Please ensure GPS/Location service is turned on.';
        else if (err.code === 3) msg = 'Location acquisition timed out.';
        setLocError(msg);
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSubmitGps = async () => {
    if (!selectedSessionId) {
      alert('Please select an active attendance session.');
      return;
    }
    if (latitude === null || longitude === null) {
      alert('Location coordinates not acquired yet. Please click "Detect Coordinates".');
      return;
    }

    setSubmitting(true);
    setResult(null);

    try {
      const res: any = await api.post('/attendance/submit/gps/', {
        session_id: selectedSessionId,
        latitude,
        longitude,
        accuracy: accuracy || undefined,
      });

      setResult({
        success: true,
        message: res.message || 'GPS Attendance verified successfully!',
        data: res.data,
      });
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || 'Location verification rejected by server.',
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
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <MapPin className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black text-slate-900">GPS Geofence Check-In</h1>
          <p className="text-xs text-slate-500 mt-1">
            Validate physical presence within authorized classroom or facility boundaries
          </p>
        </div>

        {/* Session Selector */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Active Session
            </label>
            {loadingSessions ? (
              <LoadingSpinner text="Checking for active GPS sessions..." />
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

          {/* Current GPS Coordinates Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-emerald-600" />
                <span>Detected Coordinates</span>
              </span>
              <button
                type="button"
                onClick={acquireLocation}
                disabled={detectingLocation}
                className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                <Navigation className={`w-3 h-3 text-brand-600 ${detectingLocation ? 'animate-spin' : ''}`} />
                <span>{detectingLocation ? 'Locating...' : 'Refresh GPS'}</span>
              </button>
            </div>

            {locError ? (
              <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{locError}</span>
              </div>
            ) : latitude !== null && longitude !== null ? (
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">Latitude</span>
                  <span className="font-bold text-slate-800">{latitude.toFixed(6)}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">Longitude</span>
                  <span className="font-bold text-slate-800">{longitude.toFixed(6)}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-2 text-center">Acquiring GPS fix from device...</p>
            )}

            {accuracy !== null && (
              <p className="text-[10px] text-slate-400 text-right">
                GPS accuracy radius: &plusmn;{accuracy.toFixed(1)}m
              </p>
            )}
          </div>

          {/* Result Alert */}
          {result && (
            <div className={`p-4 rounded-xl text-xs flex items-start gap-3 ${result.success
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
              {result.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-bold">{result.success ? 'GPS Check-In Confirmed!' : 'Geofence Check Failed'}</div>
                <div className="mt-0.5 text-[11px] leading-relaxed">{result.message}</div>
              </div>
            </div>
          )}

          <button
            onClick={handleSubmitGps}
            disabled={submitting || latitude === null || longitude === null || !selectedSessionId}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? 'Verifying Distance...' : 'Submit GPS Attendance'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ParticipantGpsPage() {
  return (
    <Suspense fallback={<LoadingSpinner text="Loading GPS module..." />}>
      <GpsContent />
    </Suspense>
  );
}
