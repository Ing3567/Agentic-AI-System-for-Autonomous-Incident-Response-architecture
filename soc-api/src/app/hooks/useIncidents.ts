'use client';

import { useState, useEffect, useCallback } from 'react';
import { Incident } from '@/types/incident';

export function useIncidents(pollInterval = 5000) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIncidents = useCallback(async () => {
    try {
      const res = await fetch('/api/incidents?limit=50');
      const json = await res.json();
      if (json.success) {
        setIncidents(json.data);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fetch failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  useEffect(() => {
    if (pollInterval <= 0) return;
    const id = setInterval(fetchIncidents, pollInterval);
    return () => clearInterval(id);
  }, [fetchIncidents, pollInterval]);

  return { incidents, loading, error, refetch: fetchIncidents };
}