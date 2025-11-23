import { describe, it, expect, vi } from 'vitest';
import { shippingAgentApiRepository } from '../../../../infrastructure/repositories/shippingAgent/shippingAgentApi.repository';

vi.mock('../../../../services/apiService', () => ({
  apiClient: {
    get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn()
  }
}));
import { apiClient } from '../../../../services/apiService';

describe('shippingAgentApiRepository fallback error propagation', () => {
  it('propagates original error when both list endpoints fail', async () => {
    const first = new Error('primary fail');
    const second = new Error('secondary fail');
    (apiClient.get as any).mockImplementation(async (url: string) => {
      if (url.endsWith('/ShippingAgentOrganizations')) throw first;
      if (url.endsWith('/ShippingAgentOrganization')) throw second;
      return { data: [] };
    });
    await expect(shippingAgentApiRepository.getAllOrganizations()).rejects.toThrow('secondary fail');
  });
});

