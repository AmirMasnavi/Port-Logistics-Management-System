// New file: planning API client
export type ResourceType = 'Crane' | 'Dock' | 'Staff';

export interface ResourceAllocationSummaryResponseDto {
  resourceType: ResourceType;
  resourceCode: string;
  periodStartUtc: string;
  periodEndUtc: string;
  totalAllocatedMinutes: number;
  operationCount: number;
}

export async function fetchResourceAllocationSummary(params: {
  resourceType: ResourceType;
  resourceCode: string;
  periodStartUtc: string; // ISO string
  periodEndUtc: string;   // ISO string
}): Promise<ResourceAllocationSummaryResponseDto> {
  const url = `/api/planning/resource-allocations/summary`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  const contentType = resp.headers.get('content-type') || '';
  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} on ${url}: ${text.slice(0, 500)}`);
  }
  if (!contentType.includes('application/json')) {
    throw new Error(`Unexpected content-type '${contentType}' from ${url}. Body preview: ${text.slice(0, 500)}`);
  }
  return JSON.parse(text);
}
