"use client";

import React from 'react';
import Link from 'next/link';
import {
  QrCode,
  MapPin,
  KeyRound,
  CheckCircle2,
  Users,
  ShieldCheck,
  BarChart3,
  ArrowRight,
  Sparkles,
  Smartphone,
  Radio,
  Building2,
  GraduationCap,
  Briefcase,
  Layers
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Public Navigation */}
      <header className="h-20 border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-50 px-6 lg:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-brand-500/20">
            Y
          </span>
          <div>
            <span className="font-extrabold text-xl text-slate-900 tracking-tight">YerooTech</span>
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 font-semibold border border-brand-200">
              SaaS v2.0
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
          >
            <span>Register as Taker</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 lg:px-12 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Transforming Prototype into Enterprise Multi-Tenant SaaS</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
          Next-Generation Attendance <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">
            Management for Every Organization
          </span>
        </h1>

        <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Say goodbye to paper sheets and insecure logins. YerooTech delivers real-time attendance tracking via dynamic expiring QR codes, GPS geofencing, temporary PINs, and automated analytics.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/register"
            className="px-6 py-3.5 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 shadow-md shadow-brand-500/20 transition-all flex items-center gap-2"
          >
            <span>Start as Attendance Taker</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/register/participant"
            className="px-6 py-3.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <Smartphone className="w-4 h-4 text-brand-600" />
            <span>Join as Participant</span>
          </Link>

          <Link
            href="/login"
            className="px-6 py-3.5 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-all"
          >
            Demo Accounts Login
          </Link>
        </div>

        {/* Organization Badges */}
        <div className="mt-16 pt-10 border-t border-slate-200/80">
          <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">
            Tailored for all attendance-taking activities
          </p>
          <div className="mt-6 flex flex-wrap justify-center items-center gap-6 text-sm font-semibold text-slate-600">
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200">
              <GraduationCap className="w-4 h-4 text-brand-600" /> Universities & Schools
            </span>
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200">
              <Building2 className="w-4 h-4 text-emerald-600" /> Companies & Teams
            </span>
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200">
              <Briefcase className="w-4 h-4 text-indigo-600" /> Training Centers & Bootcamps
            </span>
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200">
              <Users className="w-4 h-4 text-amber-600" /> Conferences & Seminars
            </span>
          </div>
        </div>
      </section>

      {/* Multiple Attendance Recording Methods */}
      <section className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Four Modern Verification Methods
            </h2>
            <p className="mt-3 text-slate-600 text-sm">
              One unified platform supporting dynamic verification methods engineered for anti-spoofing and ease of use.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Method 1: QR */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-brand-300 transition-all">
              <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center mb-5">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Dynamic QR Codes</h3>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                Project dynamic, session-specific QR codes with automatic token expiry to prevent screenshots and unauthorized replay attacks.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-brand-700 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-brand-600" /> Token Refresh & Expiry
              </div>
            </div>

            {/* Method 2: GPS */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">GPS Geofencing</h3>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                Define geographic coordinates and permitted radius. Calculates real-time distance using Haversine formula right in your browser.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Configurable Radius
              </div>
            </div>

            {/* Method 3: PIN */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-amber-300 transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-5">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Temporary PIN Code</h3>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                Generate 6-digit one-time access codes for quick in-person check-in without requiring participants to aim phone cameras.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-amber-700 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-amber-600" /> One-time Auto-expiring
              </div>
            </div>

            {/* Method 4: Manual */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-purple-300 transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-5">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Manual Roster & Audit</h3>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                Searchable participant table with single & bulk marking (Present, Late, Absent, Excused) and comprehensive audit logging.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-purple-700 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-purple-600" /> Full Audit Trail
              </div>
            </div>
          </div>

          {/* NFC architecture callout */}
          <div className="mt-8 p-4 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Radio className="w-5 h-5 text-brand-600" />
              <div>
                <span className="text-xs font-bold text-brand-900">Future-Proof Hardware Architecture: </span>
                <span className="text-xs text-brand-700">NFC Contactless Smartcard schema & fields integrated into participant database for physical card tapping.</span>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-white border border-brand-300 text-brand-800">
              Hardware Ready
            </span>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 max-w-7xl mx-auto px-6 lg:px-12">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            How YerooTech Works
          </h2>
          <p className="mt-3 text-slate-600 text-sm">
            Three simple steps for attendance takers and participants.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center">
            <div className="w-10 h-10 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center mx-auto mb-4">
              1
            </div>
            <h4 className="font-bold text-slate-900">Create Attendance Group</h4>
            <p className="mt-2 text-xs text-slate-500">
              Define your class or organization, configure enrollment limits, and share registration QR codes or invitation links.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center">
            <div className="w-10 h-10 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center mx-auto mb-4">
              2
            </div>
            <h4 className="font-bold text-slate-900">Launch Active Session</h4>
            <p className="mt-2 text-xs text-slate-500">
              Select your attendance method (QR, GPS, PIN, or Manual). Set start time, late thresholds, and geofence coordinates.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center">
            <div className="w-10 h-10 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center mx-auto mb-4">
              3
            </div>
            <h4 className="font-bold text-slate-900">Real-Time Analytics</h4>
            <p className="mt-2 text-xs text-slate-500">
              Submissions arrive live. Export instant summaries into high-resolution PDF certificates, Excel spreadsheets, or CSV logs.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-10 px-6 lg:px-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-brand-500 text-white flex items-center justify-center font-bold text-xs">
              Y
            </span>
            <span className="text-white font-bold text-sm">YerooTech Attendance SaaS</span>
          </div>
          <p className="text-xs text-slate-500">
            &copy; 2026 YerooTech Inc. Multi-tenant SaaS Attendance Management System. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link href="/register" className="hover:text-white transition-colors">Taker Register</Link>
            <Link href="/register/participant" className="hover:text-white transition-colors">Participant Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

