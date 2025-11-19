import { apiClient } from '../../../services/apiService';
import type { IShippingAgentRepository } from '../../../app/shippingAgent/shippingAgent.repository';
import type { CreateShippingAgentOrganizationDto, CreateShippingAgentRepresentativeDto, UpdateShippingAgentRepresentativeDto } from './shippingAgent.dto';
import { ShippingAgentMapper } from './shippingAgent.mapper';
import type { ShippingAgentOrganization, ShippingAgentRepresentative } from '../../../domain/shippingAgent/shippingAgent.model';

// Concrete implementation depending on Axios apiClient.
export const shippingAgentApiRepository: IShippingAgentRepository = {
  async getAllOrganizations(): Promise<ShippingAgentOrganization[]> {
    try {
      const resp = await apiClient.get<any[]>(`/ShippingAgentOrganizations`);
      return ShippingAgentMapper.toOrganizationList(resp.data);
    } catch (error: any) {
      // Fallback singular endpoint
      try {
        const resp2 = await apiClient.get<any[]>(`/ShippingAgentOrganization`);
        return ShippingAgentMapper.toOrganizationList(resp2.data);
      } catch (err) {
        throw err;
      }
    }
  },
  async getAllRepresentatives(): Promise<ShippingAgentRepresentative[]> {
    const resp = await apiClient.get<any[]>(`/ShippingAgentRepresentatives`);
    return ShippingAgentMapper.toRepresentativeList(resp.data);
  },
  async createOrganization(dto: CreateShippingAgentOrganizationDto): Promise<ShippingAgentOrganization> {
    const resp = await apiClient.post<any>(`/ShippingAgentOrganizations`, dto);
    return ShippingAgentMapper.toOrganization(resp.data);
  },
  async createRepresentative(dto: CreateShippingAgentRepresentativeDto): Promise<ShippingAgentRepresentative> {
    const resp = await apiClient.post<any>(`/ShippingAgentRepresentatives`, dto);
    return ShippingAgentMapper.toRepresentative(resp.data);
  },
  async updateRepresentative(citizenId: string, dto: UpdateShippingAgentRepresentativeDto): Promise<ShippingAgentRepresentative> {
    const encoded = encodeURIComponent(citizenId);
    const resp = await apiClient.put<any>(`/ShippingAgentRepresentatives/${encoded}`, dto);
    return ShippingAgentMapper.toRepresentative(resp.data);
  },
  async deleteRepresentative(citizenId: string): Promise<void> {
    const encoded = encodeURIComponent(citizenId);
    await apiClient.delete(`/ShippingAgentRepresentatives/${encoded}`);
  }
};

