// Domain models (pure business entities) for Shipping Agent Organizations & Representatives
export interface ShippingAgentRepresentative {
  id: string;
  name: string;
  citizenId: string;
  nationality?: string;
  email?: string;
  phone?: string;
  organizationId?: string;
  organizationName?: string;
}

export interface ShippingAgentOrganization {
  id: string;
  name: string; // Legal or alternative name
  address?: string; // Combined Street, City, Country
  email?: string;
  phone?: string;
  taxNumber?: string;
}

export interface ShippingAgentAggregate {
  organizations: ShippingAgentOrganization[];
  representatives: ShippingAgentRepresentative[];
}
