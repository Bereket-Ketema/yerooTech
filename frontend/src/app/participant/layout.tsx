"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { LoadingSpinner } from '@/components/EmptyState';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  QrCode,
  MapPin,
  KeyRound,
  GraduationCap,
  CalendarCheck,
  User as UserIcon
} from 'lucide-react';

export default function ParticipantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner text="Connecting to participant portal..." />
      </div>
    );
  }

  const mobileNav = [
    { name: 'Home', href: '/participant', icon: LayoutDashboard },
    { name: 'Scan QR', href: '/participant/scan', icon: QrCode },
    { name: 'GPS', href: '/participant/gps', icon: MapPin },
    { name: 'PIN', href: '/participant/pin', icon: KeyRound },
    { name: 'History', href: '/participant/history', icon: CalendarCheck },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20 md:pb-0">
      <Navbar />
      <div className="flex flex-1">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Mobile-First Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 z-40 px-2 flex items-center justify-around shadow-lg">
        {mobileNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors ${
                isActive ? 'text-brand-600' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

