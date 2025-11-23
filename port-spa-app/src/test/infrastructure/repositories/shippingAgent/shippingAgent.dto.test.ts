import { describe, it, expect } from 'vitest';
import type { CreateShippingAgentOrganizationDto, CreateShippingAgentRepresentativeDto } from '../../../../infrastructure/repositories/shippingAgent/shippingAgent.dto';

// DTO tests assert minimal structural contracts (helps catch accidental refactors breaking expected keys).

describe('ShippingAgent DTO structure', () => {
  it('CreateShippingAgentOrganizationDto minimal shape', () => {
    const dto: CreateShippingAgentOrganizationDto = {
      LegalName: 'Atlantic Maritime',
      AlternativeName: 'Atlantic Maritime',
      Street: 'Rua do Porto 123',
      City: 'Porto',
      Country: 'Portugal',
      Email: 'contact@atlantic.example',
      Phone: '912345678',
      TaxNumber: '501234567',
      Representatives: [
        {
          RepresentativeName: 'Joao Silva',
          CitizenId: 'AB12345678',
          RepresentativeNationality: 'Portuguese',
          RepresentativeEmail: 'joao@atlantic.example',
          RepresentativePhone: '923456789'
        }
      ]
    };
    expect(dto.Representatives).toHaveLength(1);
    expect(dto.Representatives[0].CitizenId).toMatch(/^[A-Z0-9]{8,}/i);
  });

  it('CreateShippingAgentRepresentativeDto minimal shape', () => {
    const repDto: CreateShippingAgentRepresentativeDto = {
      RepresentativeName: 'Maria Santos',
      CitizenId: 'CD23456789',
      RepresentativeNationality: 'Portuguese',
      RepresentativeEmail: 'maria@atlantic.example',
      RepresentativePhone: '934567890',
      OrganizationName: 'Atlantic Maritime'
    };
    expect(repDto.OrganizationName).toBe('Atlantic Maritime');
    expect(repDto.CitizenId).toMatch(/^[A-Z0-9]{8,}/i);
  });
});

