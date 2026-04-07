'use client';

import React from 'react';
import {
  X, Clock, Globe, Brain, Terminal, Loader2,
  AlertTriangle, Zap, CheckCircle2, AlertCircle, UserCheck,
} from 'lucide-react';
import { Incident, hasApprovalFlow } from '@/types/incident';
import StatusBadge from './StatusBadge';
import SeverityBadge from './SeverityBadge';
import ApproveButton from './ApproveButton';

interface DetailPanelProps {
  incident: Incident | null;
  onClose: () => void;
  onRefresh: () => void;
}

const timelineIcons: Record<string, { bg: string; icon: React.ElementType }> = {
  detection: { bg: 'bg-rose-500', icon: AlertTriangle },
  analysis: { bg: 'bg-blue-500', icon: Brain },
  action: { bg: 'bg-amber-500', icon: Zap },
  resolution: { bg: 'bg-emerald-500', icon: CheckCircle2 },
  approval: { bg: 'bg-purple-500', icon: UserCheck },
};

export default function DetailPanel({ incident, onClose, onRefresh }: DetailPanelProps) {
  if (!incident) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-slate-950 border-l border-slate-800 overflow-y-auto animate-slide-in">
        {/* Header */}
        <div className="sticky top-0 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800 p-6 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold text-white">
                #{incident.incidentNumber}
              </h2>
              <StatusBadge status={incident.status} />
            </div>
            <button
              onClick={onClose} aria-label="View Alerts"
              className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-slate-400 mt-2">
            {incident.threatType} • {new Date(incident.timestamp).toLocaleString()}
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* ===== Approve Button (แสดงเฉพาะที่ต้อง approve) ===== */}
          <ApproveButton
            incident={incident}
            onComplete={() => {
              onRefresh();
              onClose();
            }}
          />

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <SummaryCard icon={Clock} color="text-blue-500" label="Duration" value={incident.duration || '—'} />
            <SummaryCard icon={Globe} color="text-purple-500" label="Source IP" value={incident.sourceIP} mono />
            <SummaryCard icon={Brain} color="text-emerald-500" label="AI Confidence" value={`${incident.confidenceScore}%`} />
          </div>

          {/* Details */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-lg font-semibold text-white mb-3">Details</h3>
            <DetailRow label="Threat Type" value={incident.threatType} />
            <DetailRow label="Severity">
              <SeverityBadge severity={incident.severity} />
            </DetailRow>
            <DetailRow label="Status">
              <StatusBadge status={incident.status} />
            </DetailRow>

            {/* แสดง Approval info เฉพาะที่มี */}
            {hasApprovalFlow(incident) && (
              <DetailRow label="Approval">
                <span className={
                  incident.approvalStatus === 'approved' ? 'text-emerald-400' :
                  incident.approvalStatus === 'rejected' ? 'text-rose-400' :
                  'text-amber-400'
                }>
                  {incident.approvalStatus === 'approved'
                    ? `✅ Approved by ${incident.approvedBy}`
                    : incident.approvalStatus === 'rejected'
                    ? `❌ Rejected by ${incident.approvedBy}`
                    : '⏳ Waiting for approval'}
                </span>
              </DetailRow>
            )}
          </div>

          {/* Timeline */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Timeline</h3>
            {incident.timeline.length > 0 ? (
              <div className="relative">
                {incident.timeline.map((event, index) => {
                  const cfg = timelineIcons[event.type] || { bg: 'bg-slate-500', icon: AlertCircle };
                  const Icon = cfg.icon;
                  const isLast = index === incident.timeline.length - 1;

                  return (
                    <div key={event.id} className="relative flex gap-4 pb-6">
                      {!isLast && <div className="absolute left-5 top-10 w-0.5 h-full bg-slate-700" />}
                      <div className={`relative z-10 w-10 h-10 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-white font-medium text-sm">
                            Step {event.step}: {event.title}
                          </h4>
                          <span className="text-slate-500 text-xs font-mono">{event.time}</span>
                        </div>
                        <p className="text-slate-400 text-sm">{event.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-3" />
                <p className="text-slate-400">Waiting for updates...</p>
              </div>
            )}
          </div>

          {/* Raw Log */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Raw Log</h3>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-sm">
              <div className="flex items-center gap-2 text-slate-500 mb-3">
                <Terminal className="w-4 h-4" />
                <span>system.log</span>
              </div>
              <pre className="text-emerald-400 overflow-x-auto whitespace-pre-wrap">
{`[${new Date(incident.timestamp).toISOString()}] ALERT: ${incident.threatType}
[source]     ${incident.sourceIP}
[severity]   ${incident.severity}
[confidence] ${incident.confidenceScore}%
[status]     ${incident.status}${
  hasApprovalFlow(incident)
    ? `\n[approval]   ${incident.approvalStatus}${incident.resumeUrl ? '\n[n8n]        Waiting for resume...' : ''}`
    : ''
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  color,
  label,
  value,
  mono,
}: {
  icon: React.ElementType;
  color: string;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-5 h-5 ${color}`} />
        <span className="text-slate-400 text-sm">{label}</span>
      </div>
      <p className={`text-xl font-semibold text-white ${mono ? 'font-mono text-base' : ''}`}>{value}</p>
    </div>
  );
}

function DetailRow({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-400">{label}</span>
      {children || <span className="text-white">{value}</span>}
    </div>
  );
}