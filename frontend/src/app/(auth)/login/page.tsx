"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'platform_admin') {
        router.push('/admin');
      } else if (user.role === 'participant') {
        router.push('/participant');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Logins
  const setDemoCredentials = (role: 'admin' | 'taker' | 'pending' | 'student') => {
    setError(null);
    if (role === 'admin') {
      setEmail('admin@yerootech.com');
      setPassword('Admin@123456');
    } else if (role === 'taker') {
      setEmail('taker@yerootech.com');
      setPassword('Taker@123456');
    } else if (role === 'pending') {
      setEmail('pending@yerootech.com');
      setPassword('Pending@123456');
    } else if (role === 'student') {
      setEmail('student1@yerootech.com');
      setPassword('Student@123456');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-brand-900 font-black text-2xl tracking-tight">
          <span className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center text-lg font-black shadow-md shadow-brand-500/20">
            Y
          </span>
          <span>YerooTech</span>
        </Link>
        <h2 className="mt-4 text-2xl font-bold text-slate-900 tracking-tight">
          Sign In to Your Workspace
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Access your attendance dashboard, sessions, or participant portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  className="block w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Signing In...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Accounts Helper */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-3">
              Fast Demo Accounts (1-Click Fill)
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDemoCredentials('taker')}
                className="p-2 rounded-lg bg-slate-50 hover:bg-brand-50 hover:text-brand-700 border border-slate-200 text-left transition-colors"
              >
                <div className="font-semibold text-slate-800">Approved Taker</div>
                <div className="text-[10px] text-slate-500">taker@yerootech.com</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('student')}
                className="p-2 rounded-lg bg-slate-50 hover:bg-brand-50 hover:text-brand-700 border border-slate-200 text-left transition-colors"
              >
                <div className="font-semibold text-slate-800">Participant</div>
                <div className="text-[10px] text-slate-500">student1@yerootech.com</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('admin')}
                className="p-2 rounded-lg bg-slate-50 hover:bg-brand-50 hover:text-brand-700 border border-slate-200 text-left transition-colors"
              >
                <div className="font-semibold text-slate-800">Platform Admin</div>
                <div className="text-[10px] text-slate-500">admin@yerootech.com</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('pending')}
                className="p-2 rounded-lg bg-slate-50 hover:bg-amber-50 hover:text-amber-800 border border-slate-200 text-left transition-colors"
              >
                <div className="font-semibold text-slate-800">Pending Taker</div>
                <div className="text-[10px] text-slate-500">pending@yerootech.com</div>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500 space-y-2">
            <div>
              New Attendance Taker?{' '}
              <Link href="/register" className="font-semibold text-brand-600 hover:text-brand-700">
                Register here
              </Link>
            </div>
            <div>
              Participant enrolling for sessions?{' '}
              <Link href="/register/participant" className="font-semibold text-brand-600 hover:text-brand-700">
                Register as Participant
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

