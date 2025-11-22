import { describe, it, expect } from 'vitest';
import { mapServerError } from '../../../infrastructure/http/errorMapper';

// Basic test replicating potential shipping agent related keys for clarity

describe('mapServerError (shipping agent usage)', () => {
  it('maps OrganizationName error', () => {
    const msg = mapServerError({ response: { data: { errors: { OrganizationName: ['Already exists'] } } } });
    expect(msg).toMatch(/organization/i);
  });

  it('returns null when no data', () => {
    expect(mapServerError({})).toBeNull();
  });
});

