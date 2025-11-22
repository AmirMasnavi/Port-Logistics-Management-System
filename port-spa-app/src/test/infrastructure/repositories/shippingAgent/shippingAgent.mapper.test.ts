import { describe, it, expect } from 'vitest';
import { ShippingAgentMapper } from '../../../../infrastructure/repositories/shippingAgent/shippingAgent.mapper';

describe('ShippingAgentMapper', () => {
  it('maps organization DTO variants correctly', () => {
    const dto = {
      OrganizationId: '123',
      LegalName: 'Atlantic Maritime',
      Street: 'Rua do Porto 123',
      City: 'Porto',
      Country: 'Portugal',
      Email: 'contact@atlantic.example',
      Phone: '912345678',
      TaxNumber: '501234567'
    };
    const org = ShippingAgentMapper.toOrganization(dto);
    expect(org.id).toBe('123');
    expect(org.name).toBe('Atlantic Maritime');
    expect(org.address).toBe('Rua do Porto 123, Porto, Portugal');
    expect(org.taxNumber).toBe('501234567');
  });

  it('maps representative DTO variants correctly', () => {
    const dto = {
      RepresentativeId: 'r-1',
      RepresentativeName: 'Joao Silva',
      CitizenId: 'AB12345678',
      RepresentativeNationality: 'Portuguese',
      RepresentativeEmail: 'joao@atlantic.example',
      RepresentativePhone: '923456789',
      OrganizationName: 'Atlantic Maritime',
      OrganizationId: '123'
    };
    const rep = ShippingAgentMapper.toRepresentative(dto);
    expect(rep.id).toBe('r-1');
    expect(rep.name).toBe('Joao Silva');
    expect(rep.citizenId).toBe('AB12345678');
    expect(rep.organizationName).toBe('Atlantic Maritime');
  });

  it('handles empty lists gracefully', () => {
    expect(ShippingAgentMapper.toOrganizationList(undefined as any)).toEqual([]);
    expect(ShippingAgentMapper.toRepresentativeList(undefined as any)).toEqual([]);
  });
});

