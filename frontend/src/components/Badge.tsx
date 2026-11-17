import React from 'react';

interface BadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export function Badge({ status, size = 'sm' }: BadgeProps) {
  const normalized = status.toLowerCase();
  
  let colorStyle = 'bg-slate-100 text-slate-700 border-slate-200';

  if (['present', 'approved', 'active'].includes(normalized)) {
    colorStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (['absent', 'rejected', 'suspended', 'cancelled'].includes(normalized)) {
    colorStyle = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (['late', 'pending', 'paused'].includes(normalized)) {
    colorStyle = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (['excused', 'scheduled'].includes(normalized)) {
    colorStyle = 'bg-blue-50 text-blue-700 border-blue-200';
  }

  const sizeStyle = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center font-medium rounded-full border capitalize ${colorStyle} ${sizeStyle}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

