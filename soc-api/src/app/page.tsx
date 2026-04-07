'use client';

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, XCircle, Send } from 'lucide-react';
import { Incident, needsApproval } from '@/types/incident';
import { useIncidents } from '../app/hooks/useIncidents';
import Sidebar from '../app/components/Sidebar';
import IncidentTable from '../app/components/IncidentTable';
import DetailPanel from '../app/components/DetailPanel';

export default function DashboardPage() {
  const { incidents, loading, refetch } = useIncidents(5000);
  const [selected, setSelected] = useState<Incident | null>(null);
  const [search, setSearch] = useState('');

  const stats = {
    total: incidents.length,
    success: incidents.filter((i) => i.status === 'Success').length,
    pending: incidents.filter((i) => i.status === 'Pending').length,
    failed: incidents.filter((i) => i.status === 'Failed').length,
    needsApproval: incidents.filter((i) => needsApproval(i)).length,
  };

  const handleRefresh = () => {
    refetch();
    if (selected) {
      fetch(`/api/incidents/${selected.id}`)
        .then((r) => r.json())
        .then((j) => { if (j.success) setSelected(j.data); })
        .catch(console.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Security Operations Center</h1>
              <p className="text-slate-400">Incident management with n8n approval workflow</p>
            </div>
            <div className="flex items-center gap-3">
              {stats.needsApproval > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-lg animate-pulse">
                  <Send className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-400 text-sm font-medium">
                    {stats.needsApproval} Pending Approval
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-emerald-400 text-sm font-medium">Live</span>
              </div>
            </div>
          </div>

          {/* Stats - แสดง Needs Approval เฉพาะเมื่อมี */}
          <div className={`grid gap-4 ${stats.needsApproval > 0 ? 'grid-cols-5' : 'grid-cols-4'}`}>
            <Stat label="Total" value={stats.total}
              icon={<AlertTriangle className="w-5 h-5 text-slate-500" />}
              valueColor="text-white" />
            <Stat label="Resolved" value={stats.success}
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              valueColor="text-emerald-400" />
            <Stat label="Pending" value={stats.pending}
              icon={<Loader2 className="w-5 h-5 text-amber-500" />}
              valueColor="text-amber-400" />
            <Stat label="Failed" value={stats.failed}
              icon={<XCircle className="w-5 h-5 text-rose-500" />}
              valueColor="text-rose-400" />

            {/* แสดงเฉพาะเมื่อมี incident ที่รอ approve */}
            {stats.needsApproval > 0 && (
              <Stat label="Needs Approval" value={stats.needsApproval}
                icon={<Send className="w-5 h-5 text-purple-500" />}
                valueColor="text-purple-400"
                highlight />
            )}
          </div>
        </header>

        <IncidentTable
          incidents={incidents}
          searchQuery={search}
          setSearchQuery={setSearch}
          onRowClick={setSelected}
          loading={loading}
        />
      </main>

      <DetailPanel
        incident={selected}
        onClose={() => setSelected(null)}
        onRefresh={handleRefresh}
      />
    </div>
  );
}

function Stat({
  label, value, icon, valueColor, highlight,
}: {
  label: string; value: number; icon: React.ReactNode;
  valueColor: string; highlight?: boolean;
}) {
  return (
    <div className={`bg-slate-900 border rounded-xl p-4 ${
      highlight ? 'border-purple-500/50 bg-purple-500/5' : 'border-slate-800'
    }`}>
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-sm">{label}</span>
        {icon}
      </div>
      <p className={`text-2xl font-bold mt-2 ${valueColor}`}>{value}</p>
    </div>
  );
}