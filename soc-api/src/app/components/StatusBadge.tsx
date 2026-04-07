import React from 'react';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';

const config: Record<string, { style: string; icon: React.ElementType; spin?: boolean }> = {
  Success: { style: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle2 },
  Pending: { style: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Loader2, spin: true },
  Failed: { style: 'bg-rose-500/20 text-rose-400 border-rose-500/30', icon: XCircle },
};

export default function StatusBadge({ status }: { status: string }) {
  const c = config[status] || config.Pending;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${c.style}`}>
      <Icon className={`w-3.5 h-3.5 ${c.spin ? 'animate-spin' : ''}`} />
      {status}
    </span>
  );
}