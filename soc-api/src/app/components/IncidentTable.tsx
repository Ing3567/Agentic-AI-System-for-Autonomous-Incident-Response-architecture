'use client';

import React from 'react';
import { Search, ChevronRight, Lock, Send } from 'lucide-react';
import { Incident, needsApproval, hasApprovalFlow } from '@/types/incident';
import StatusBadge from './StatusBadge';
import SeverityBadge from './SeverityBadge';

interface IncidentTableProps {
  incidents: Incident[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onRowClick: (incident: Incident) => void;
  loading: boolean;
}

export default function IncidentTable({
  incidents,
  searchQuery,
  setSearchQuery,
  onRowClick,
  loading,
}: IncidentTableProps) {
  const filtered = incidents.filter(
    (i) =>
      i.incidentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.threatType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.sourceIP.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-white">Incidents</h2>
            {loading && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Polling...
              </span>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left py-4 px-6 text-slate-400 font-medium text-sm">ID</th>
              <th className="text-left py-4 px-6 text-slate-400 font-medium text-sm">Time</th>
              <th className="text-left py-4 px-6 text-slate-400 font-medium text-sm">Threat</th>
              <th className="text-left py-4 px-6 text-slate-400 font-medium text-sm">Severity</th>
              <th className="text-left py-4 px-6 text-slate-400 font-medium text-sm">Status</th>
              <th className="text-left py-4 px-6 text-slate-400 font-medium text-sm">Action</th>
              <th className="py-4 px-6" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  {loading ? 'Loading...' : 'No incidents found'}
                </td>
              </tr>
            ) : (
              filtered.map((incident) => (
                <tr
                  key={incident.id}
                  onClick={() => onRowClick(incident)}
                  className={`border-b border-slate-800/50 hover:bg-slate-800/50 cursor-pointer transition-colors ${
                    needsApproval(incident) ? 'bg-amber-500/5' : ''
                  }`}
                >
                  <td className="py-4 px-6">
                    <span className="text-white font-mono font-medium text-sm">
                      {incident.incidentNumber}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-300 text-sm">
                    {new Date(incident.timestamp).toLocaleString()}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-slate-500" />
                      <span className="text-white text-sm">{incident.threatType}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <SeverityBadge severity={incident.severity} />
                  </td>
                  <td className="py-4 px-6">
                    <StatusBadge status={incident.status} />
                  </td>
                  <td className="py-4 px-6">
                    {/* แสดง Approval Status เฉพาะที่มี */}
                    <ApprovalCell incident={incident} />
                  </td>
                  <td className="py-4 px-6">
                    <ChevronRight className="w-5 h-5 text-slate-500" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-slate-800 text-slate-500 text-sm">
        {filtered.length} of {incidents.length} incidents • Auto-refresh 5s
      </div>
    </section>
  );
}

/**
 * แสดง Approval Column ตามเงื่อนไข
 */
function ApprovalCell({ incident }: { incident: Incident }) {
  // ไม่มี approval flow → แสดง dash
  if (!hasApprovalFlow(incident)) {
    return <span className="text-slate-600 text-xs">—</span>;
  }

  // รอ approve
  if (needsApproval(incident)) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
        <Send className="w-3 h-3" />
        Needs Approval
      </span>
    );
  }

  // Approved
  if (incident.approvalStatus === 'approved') {
    return <span className="text-emerald-400 text-xs">✓ Approved</span>;
  }

  // Rejected
  if (incident.approvalStatus === 'rejected') {
    return <span className="text-rose-400 text-xs">✗ Rejected</span>;
  }

  return <span className="text-slate-600 text-xs">—</span>;
}