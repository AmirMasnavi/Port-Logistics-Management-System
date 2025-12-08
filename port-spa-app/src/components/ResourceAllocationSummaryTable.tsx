import React from 'react';
import type { ResourceAllocationSummaryResponseDto } from '../api/planning';

interface Props {
  summary?: ResourceAllocationSummaryResponseDto;
  loading?: boolean;
  error?: string;
}

export const ResourceAllocationSummaryTable: React.FC<Props> = ({ summary, loading, error }) => {
  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!summary) return <div className="p-4">No data</div>;
  const hours = (summary.totalAllocatedMinutes / 60).toFixed(2);
  return (
    <div className="overflow-x-auto p-4">
      <table className="min-w-full border border-gray-200">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-2 text-left">Resource</th>
            <th className="px-4 py-2 text-left">Period Start (UTC)</th>
            <th className="px-4 py-2 text-left">Period End (UTC)</th>
            <th className="px-4 py-2 text-left">Total Allocated (min)</th>
            <th className="px-4 py-2 text-left">Total Allocated (hours)</th>
            <th className="px-4 py-2 text-left">Operations</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="px-4 py-2">{summary.resourceType} {summary.resourceCode}</td>
            <td className="px-4 py-2">{summary.periodStartUtc}</td>
            <td className="px-4 py-2">{summary.periodEndUtc}</td>
            <td className="px-4 py-2">{summary.totalAllocatedMinutes}</td>
            <td className="px-4 py-2">{hours}</td>
            <td className="px-4 py-2">{summary.operationCount}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

