import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shippingAgentApiRepository } from '../../../../infrastructure/repositories/shippingAgent/shippingAgentApi.repository';

// Mock apiClient from services/apiService
vi.mock('../../../../services/apiService', () => {
  return {
    apiClient: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    }
  };
});

// Import after mock
import { apiClient } from '../../../../services/apiService';

describe('shippingAgentApiRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAllOrganizations falls back to singular endpoint on failure', async () => {
    (apiClient.get as any).mockImplementation(async (url: string) => {
      if (url.endsWith('/ShippingAgentOrganizations')) throw new Error('fail');
      if (url.endsWith('/ShippingAgentOrganization')) return { data: [{ LegalName: 'Org1', Street: 'A', City: 'B', Country: 'C' }] };
      throw new Error('unexpected url');
    });
    const result = await shippingAgentApiRepository.getAllOrganizations();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Org1');
  });

  it('getAllRepresentatives maps list', async () => {
    (apiClient.get as any).mockResolvedValue({ data: [{ RepresentativeName: 'Rep1', CitizenId: 'AA111111', RepresentativeNationality: 'Portuguese' }] });
    const reps = await shippingAgentApiRepository.getAllRepresentatives();
    expect(reps[0].name).toBe('Rep1');
  });

  it('createOrganization posts and maps', async () => {
    (apiClient.post as any).mockResolvedValue({ data: { LegalName: 'NewOrg', Street: 'S', City: 'C', Country: 'PT', TaxNumber: '501234567' } });
    const created = await shippingAgentApiRepository.createOrganization({} as any);
    expect(created.name).toBe('NewOrg');
  });

  it('createRepresentative posts and maps', async () => {
    (apiClient.post as any).mockResolvedValue({ data: { RepresentativeName: 'NewRep', CitizenId: 'AB12345678' } });
    const created = await shippingAgentApiRepository.createRepresentative({} as any);
    expect(created.name).toBe('NewRep');
  });

  it('updateRepresentative puts and maps', async () => {
    (apiClient.put as any).mockResolvedValue({ data: { RepresentativeName: 'EditedRep', CitizenId: 'AB12345678' } });
    const updated = await shippingAgentApiRepository.updateRepresentative('AB12345678', {} as any);
    expect(updated.name).toBe('EditedRep');
  });

  it('deleteRepresentative calls delete endpoint', async () => {
    (apiClient.delete as any).mockResolvedValue({ status: 204 });
    await shippingAgentApiRepository.deleteRepresentative('AB12345678');
    expect(apiClient.delete).toHaveBeenCalled();
  });
});

