import React from 'react';

const colors: Record<string, { text: string; dot: string }> = {
  High: { text: 'text-rose-400', dot: 'bg-rose-400' },
  Medium: { text: 'text-amber-400', dot: 'bg-amber-400' },
  Low: { text: 'text-slate-400', dot: 'bg-slate-400' },
};

export default function SeverityBadge({ severity }: { severity: string }) {
  const c = colors[severity] || colors.Low;
  return (
    <span className={`inline-flex items-center gap-2 text-sm ${c.text}`}>
      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
      {severity}
    </span>
  );
}