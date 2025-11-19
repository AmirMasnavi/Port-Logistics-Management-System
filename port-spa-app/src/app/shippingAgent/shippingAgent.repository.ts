import type { ShippingAgentOrganization, ShippingAgentRepresentative } from '../../domain/shippingAgent/shippingAgent.model';
import type { CreateShippingAgentOrganizationDto, CreateShippingAgentRepresentativeDto, UpdateShippingAgentRepresentativeDto } from '../../infrastructure/repositories/shippingAgent/shippingAgent.dto';

export interface IShippingAgentRepository {
  getAllOrganizations: () => Promise<ShippingAgentOrganization[]>;
  getAllRepresentatives: () => Promise<ShippingAgentRepresentative[]>;
  createOrganization: (dto: CreateShippingAgentOrganizationDto) => Promise<ShippingAgentOrganization>;
  createRepresentative: (dto: CreateShippingAgentRepresentativeDto) => Promise<ShippingAgentRepresentative>;
  updateRepresentative: (citizenId: string, dto: UpdateShippingAgentRepresentativeDto) => Promise<ShippingAgentRepresentative>;
  deleteRepresentative: (citizenId: string) => Promise<void>;
}

