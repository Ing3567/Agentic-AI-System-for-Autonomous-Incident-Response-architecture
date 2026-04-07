'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle, Loader2, Send } from 'lucide-react';
import { Incident, needsApproval } from '@/types/incident';

interface ApproveButtonProps {
  incident: Incident;
  onComplete: () => void;
}

export default function ApproveButton({ incident, onComplete }: ApproveButtonProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState('');

  // ===== ไม่แสดงถ้าไม่ต้อง approve =====
  if (!needsApproval(incident)) {
    return null;
  }

  const handleAction = async (action: 'approve' | 'reject') => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`/api/incidents/${incident.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          approvedBy: 'SOC Analyst',
          reason: reason || undefined,
        }),
      });

      const json = await res.json();

      setResult({
        success: json.success,
        message: json.success
          ? json.message || `Incident ${action === 'approve' ? 'approved' : 'rejected'}`
          : json.error || 'Action failed',
      });

      if (json.success) {
        setTimeout(onComplete, 1500);
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Request failed',
      });
    } finally {
      setLoading(false);
      setShowReject(false);
      setReason('');
    }
  };

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
          <Send className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h4 className="text-amber-400 font-medium">Approval Required</h4>
          <p className="text-slate-400 text-sm">
            n8n is waiting — approve to continue the workflow
          </p>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className={`mb-3 p-3 rounded-lg text-sm ${
          result.success
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
        }`}>
          {result.message}
        </div>
      )}

      {/* Reject Reason */}
      {showReject && (
        <input
          type="text"
          placeholder="Reason for rejection (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full mb-3 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
        />
      )}

      {/* Buttons */}
      {!result?.success && (
        <div className="flex gap-3">
          {!showReject ? (
            <>
              <button
                onClick={() => handleAction('approve')}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-400 text-white rounded-lg font-medium transition-colors"
              >
                {loading
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <CheckCircle2 className="w-5 h-5" />}
                Approve & Resume n8n
              </button>
              <button
                onClick={() => setShowReject(true)}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800 text-rose-400 rounded-lg font-medium transition-colors border border-slate-700"
              >
                <XCircle className="w-5 h-5" />
                Reject
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleAction('reject')}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-rose-500 hover:bg-rose-600 disabled:bg-slate-700 text-white rounded-lg font-medium transition-colors"
              >
                {loading
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <XCircle className="w-5 h-5" />}
                Confirm Reject
              </button>
              <button
                onClick={() => { setShowReject(false); setReason(''); }}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}