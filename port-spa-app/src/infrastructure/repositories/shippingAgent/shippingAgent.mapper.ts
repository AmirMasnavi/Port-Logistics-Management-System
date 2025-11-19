import type { ShippingAgentOrganization, ShippingAgentRepresentative } from '../../../domain/shippingAgent/shippingAgent.model';

// Mapper centraliza normalização dos DTOs backend para modelos de domínio.
// Move a lógica de normalização que estava embutida na página.
export class ShippingAgentMapper {
  static toOrganization(dto: any): ShippingAgentOrganization {
    return {
      id: dto.id ?? dto.organizationId ?? dto.OrganizationId ?? '',
      name: dto.legalName ?? dto.LegalName ?? dto.legalname ?? dto.name ?? dto.AlternativeName ?? '',
      address: [dto.street ?? dto.Street, dto.city ?? dto.City, dto.country ?? dto.Country]
        .filter(Boolean)
        .join(', ') || undefined,
      email: dto.email ?? dto.Email ?? undefined,
      phone: dto.phone ?? dto.Phone ?? undefined,
      taxNumber: dto.taxNumber ?? dto.TaxNumber ?? dto.Tax_Number ?? undefined,
    };
  }

  static toRepresentative(dto: any): ShippingAgentRepresentative {
    return {
      id: dto.id ?? dto.representativeId ?? dto.RepresentativeId ?? '',
      name: dto.name ?? dto.RepresentativeName ?? dto.representativeName ?? '',
      citizenId: dto.taxNumber ?? dto.TaxNumber ?? dto.citizenId ?? dto.CitizenId ?? '',
      nationality: dto.nationality ?? dto.RepresentativeNationality ?? dto.representativeNationality ?? '',
      email: dto.email ?? dto.RepresentativeEmail ?? dto.representativeEmail ?? undefined,
      phone: dto.phone ?? dto.RepresentativePhone ?? dto.representativePhone ?? undefined,
      organizationId: dto.organizationId ?? dto.OrganizationId ?? dto.organizationID ?? undefined,
      organizationName: dto.organizationName ?? dto.OrganizationName ?? dto.organizationname ?? undefined,
    };
  }

  static toOrganizationList(list: any[]): ShippingAgentOrganization[] {
    return (Array.isArray(list) ? list : []).map(this.toOrganization);
  }

  static toRepresentativeList(list: any[]): ShippingAgentRepresentative[] {
    return (Array.isArray(list) ? list : []).map(this.toRepresentative);
  }
}

