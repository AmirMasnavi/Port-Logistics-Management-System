// DTOs describing the shape exchanged with the backend API.
// We keep PascalCase to align with backend expectations when sending payloads.

export interface CreateShippingAgentRepresentativeDto {
  RepresentativeName: string;
  CitizenId: string; // Provided by user
  RepresentativeNationality: string;
  RepresentativeEmail?: string;
  RepresentativePhone?: string;
  OrganizationName: string; // Required to link representative
  OrganizationId?: string; // Optional shortcut if we already resolved
}

export interface UpdateShippingAgentRepresentativeDto extends CreateShippingAgentRepresentativeDto {}

export interface CreateShippingAgentOrganizationDto {
  LegalName: string;
  AlternativeName: string; // Domain requires; we mirror logic using same as LegalName if user does not provide distinct one
  Street: string;
  City: string;
  Country: string;
  Email: string;
  Phone: string;
  TaxNumber: string;
  Representatives: Array<{
    RepresentativeName: string;
    CitizenId: string;
    RepresentativeNationality: string;
    RepresentativeEmail: string;
    RepresentativePhone: string;
  }>;
}

