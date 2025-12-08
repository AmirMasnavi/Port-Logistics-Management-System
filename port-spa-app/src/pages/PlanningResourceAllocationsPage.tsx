import React, { useState } from 'react';
import { fetchResourceAllocationSummary } from '../api/planning';
import type { ResourceType } from '../api/planning';
import { ResourceAllocationSummaryTable } from '../components/ResourceAllocationSummaryTable';

export default function PlanningResourceAllocationsPage() {
  const [resourceType, setResourceType] = useState<ResourceType>('Crane');
  const [resourceCode, setResourceCode] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [summary, setSummary] = useState<any>(undefined);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    setLoading(true);
    try {
      if (!resourceCode || !start || !end) {
        setError('Please provide resource code, start and end.');
        setLoading(false);
        return;
      }
      const res = await fetchResourceAllocationSummary({
        resourceType,
        resourceCode,
        periodStartUtc: new Date(start).toISOString(),
        periodEndUtc: new Date(end).toISOString(),
      });
      setSummary(res);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Resource Allocation Summary</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="flex gap-4">
          <label className="flex flex-col">
            <span className="text-sm">Resource Type</span>
            <select value={resourceType} onChange={e => setResourceType(e.target.value as ResourceType)} className="border px-2 py-1">
              <option value="Crane">Crane</option>
              <option value="Dock">Dock</option>
              <option value="Staff">Staff</option>
            </select>
          </label>
          <label className="flex flex-col">
            <span className="text-sm">Resource Code</span>
            <input value={resourceCode} onChange={e => setResourceCode(e.target.value)} className="border px-2 py-1" placeholder="e.g., CR-01" />
          </label>
          <label className="flex flex-col">
            <span className="text-sm">Start (local)</span>
            <input type="datetime-local" value={start} onChange={e => setStart(e.target.value)} className="border px-2 py-1" />
          </label>
          <label className="flex flex-col">
            <span className="text-sm">End (local)</span>
            <input type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} className="border px-2 py-1" />
          </label>
          <button type="submit" className="bg-blue-600 text-white px-3 py-2 rounded">Query</button>
        </div>
      </form>

      <ResourceAllocationSummaryTable summary={summary} loading={loading} error={error} />
    </div>
  );
}
