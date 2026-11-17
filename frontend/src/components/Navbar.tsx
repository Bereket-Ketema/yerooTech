"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Bell, LogOut, User as UserIcon, ShieldAlert } from 'lucide-react';
import { Badge } from './Badge';
import { api } from '@/lib/api';

export function Navbar() {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      api.get<any>('/notifications/unread-count/')
        .then(res => setUnreadCount(res.unread_count || 0))
        .catch(() => {});
    }
  }, [user]);

  if (!user) return null;

  return (
    <>
      {user.role === 'attendance_taker' && user.account_status === 'pending' && (
        <div className="bg-amber-500 text-white px-4 py-2.5 text-xs font-medium flex items-center justify-center gap-2 shadow-inner">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>
            Your account is currently <strong>Pending Administrator Approval</strong>. Some attendance features are restricted until an admin approves your profile.
          </span>
        </div>
      )}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-brand-900 font-extrabold text-lg tracking-tight">
            <span className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center text-sm font-black shadow-sm">
              Y
            </span>
            <span>YerooTech</span>
            <span className="text-xs px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-semibold border border-brand-200">
              SaaS
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href={
              user.role === 'attendance_taker'
                ? '/dashboard/notifications'
                : user.role === 'participant'
                ? '/participant'
                : '/admin'
            }
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </Link>

          <div className="h-6 w-px bg-slate-200" />

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-900">{user.full_name}</p>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                <Badge status={user.role} size="sm" />
                {user.role === 'attendance_taker' && (
                  <Badge status={user.account_status} size="sm" />
                )}
              </div>
            </div>

            <button
              onClick={logout}
              title="Logout"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}

