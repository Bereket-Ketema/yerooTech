"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  QrCode,
  MapPin,
  KeyRound,
  FileBarChart,
  Bell,
  Settings,
  ShieldCheck,
  UserCheck,
  Layers,
  GraduationCap
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  let links = [];

  if (user.role === 'attendance_taker') {
    links = [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'My Groups', href: '/dashboard/groups', icon: Layers },
      { name: 'Attendance Sessions', href: '/dashboard/sessions', icon: CalendarCheck },
      { name: 'Participants', href: '/dashboard/participants', icon: Users },
      { name: 'Reports & Analytics', href: '/dashboard/reports', icon: FileBarChart },
      { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
      { name: 'Profile & Settings', href: '/dashboard/profile', icon: Settings },
    ];
  } else if (user.role === 'participant') {
    links = [
      { name: 'Portal Home', href: '/participant', icon: LayoutDashboard },
      { name: 'Scan QR Attendance', href: '/participant/scan', icon: QrCode },
      { name: 'GPS Check-in', href: '/participant/gps', icon: MapPin },
      { name: 'PIN Code Entry', href: '/participant/pin', icon: KeyRound },
      { name: 'My Enrolled Groups', href: '/participant/groups', icon: GraduationCap },
      { name: 'Attendance History', href: '/participant/history', icon: CalendarCheck },
      { name: 'Profile & Badge', href: '/participant/profile', icon: Settings },
    ];
  } else if (user.role === 'platform_admin') {
    links = [
      { name: 'Admin Overview', href: '/admin', icon: LayoutDashboard },
      { name: 'Pending Approvals', href: '/admin/pending', icon: UserCheck },
      { name: 'User Management', href: '/admin/users', icon: ShieldCheck },
    ];
  }

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] flex flex-col justify-between py-6 shrink-0">
      <div className="px-4">
        <div className="mb-4 px-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {user.role === 'attendance_taker'
              ? 'Taker Workspace'
              : user.role === 'participant'
              ? 'Participant Portal'
              : 'Administration'}
          </p>
        </div>
        <nav className="space-y-1">
          {links.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="px-6 pt-4 border-t border-slate-100">
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
          <p className="text-xs font-semibold text-slate-800 truncate">{user.full_name}</p>
          <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
        </div>
      </div>
    </aside>
  );
}

