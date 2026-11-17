"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { LoadingSpinner } from '@/components/EmptyState';
import { GraduationCap, CheckCircle2, AlertCircle, ArrowRight, UserPlus } from 'lucide-react';

export default function JoinGroupPage() {
  const { token } = useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; group?: any } | null>(null);

  useEffect(() => {
    if (!authLoading && user && token) {
      handleAutoJoin();
    }
  }, [user, authLoading, token]);

  const handleAutoJoin = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res: any = await api.post('/groups/join/', {
        invite_token: token,
      });

      setResult({
        success: true,
        message: res.message || 'You have successfully joined the group!',
        group: res.data,
      });
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || 'Could not join group. The invitation link may be invalid or closed.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-brand-900 font-black text-2xl tracking-tight">
          <span className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center text-lg font-black shadow-md">
            Y
          </span>
          <span>YerooTech</span>
        </Link>
        <h2 className="mt-4 text-2xl font-bold text-slate-900">Group Enrollment Invitation</h2>
        <p className="mt-1 text-xs text-slate-500">
          You were invited to enroll in an attendance group
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl text-center">
          {authLoading || loading ? (
            <LoadingSpinner text="Processing group enrollment..." />
          ) : user ? (
            <div>
              {result && (
                <div className={`p-4 rounded-xl text-xs mb-6 text-left flex items-start gap-3 ${
                  result.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {result.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold">{result.success ? 'Enrollment Successful!' : 'Enrollment Notice'}</div>
                    <div className="mt-0.5 text-[11px] leading-relaxed">{result.message}</div>
                  </div>
                </div>
              )}

              {result?.group && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left mb-6 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-brand-600 block">
                    {result.group.category}
                  </span>
                  <h4 className="font-bold text-slate-900 text-base">{result.group.name}</h4>
                  <p className="text-xs text-slate-500">{result.group.description || 'Welcome to the group.'}</p>
                </div>
              )}

              <Link
                href="/participant"
                className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <span>Go to Participant Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3">
                <UserPlus className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Sign In or Register to Join</h3>
              <p className="text-xs text-slate-500">
                Please sign in with your participant account or register in 30 seconds to confirm enrollment.
              </p>

              <div className="pt-4 flex flex-col gap-2.5">
                <Link
                  href="/login"
                  className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm transition-colors"
                >
                  Sign In to Existing Account
                </Link>
                <Link
                  href="/register/participant"
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors"
                >
                  Register New Participant Account
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

