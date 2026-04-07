'use client';

import React from 'react';
import { AlertTriangle, Shield } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="w-20 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-6 gap-2">
      <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mb-8">
        <Shield className="w-7 h-7 text-slate-950" />
      </div>
      <button aria-label="View Alerts"
      className="w-14 h-14 rounded-xl flex items-center justify-center bg-emerald-500/20 text-emerald-400">
        <AlertTriangle className="w-6 h-6" />
      </button>
    </aside>
  );
}