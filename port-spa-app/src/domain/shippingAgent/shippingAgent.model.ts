// Domain models (pure business entities) for Shipping Agent Organizations & Representatives
}
  representatives: ShippingAgentRepresentative[];
  organizations: ShippingAgentOrganization[];
export interface ShippingAgentAggregate {

}
  organizationName?: string;
  organizationId?: string;
  phone?: string;
  email?: string;
  nationality?: string;
  citizenId: string; // Backend may send TaxNumber or CitizenId; we unify as citizenId for UI usage
  name: string;
  id: string;
export interface ShippingAgentRepresentative {

}
  taxNumber?: string;
  phone?: string;
  email?: string;
  address?: string; // Combined Street, City, Country for UI convenience
  name: string; // LegalName normalized (or AlternativeName if needed)
  id: string;
export interface ShippingAgentOrganization {

