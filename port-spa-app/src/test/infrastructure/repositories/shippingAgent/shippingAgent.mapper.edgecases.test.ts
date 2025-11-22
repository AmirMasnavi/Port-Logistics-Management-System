import { describe, it, expect } from 'vitest';
import { ShippingAgentMapper } from '../../../../infrastructure/repositories/shippingAgent/shippingAgent.mapper';

describe('ShippingAgentMapper edge cases', () => {
  it('falls back to AlternativeName when LegalName missing', () => {
    const dto = { AlternativeName: 'Alt Name', Street: 'S', City: 'C', Country: 'PT' };
    const org = ShippingAgentMapper.toOrganization(dto);
    expect(org.name).toBe('Alt Name');
    expect(org.address).toBe('S, C, PT');
  });

  it('returns single component address when only street provided (implementation behaviour)', () => {
    const dto = { LegalName: 'Org', Street: 'Only Street' };
    const org = ShippingAgentMapper.toOrganization(dto);
    // Mapper junta componentes existentes; com apenas Street devolve string única
    expect(org.address).toBe('Only Street');
  });

  it('returns multi-part address when 2 components provided', () => {
    const dto = { LegalName: 'Org', Street: 'Rua X', City: 'Porto' };
    const org = ShippingAgentMapper.toOrganization(dto);
    expect(org.address).toBe('Rua X, Porto');
  });

  it('returns undefined address when no components provided', () => {
    const dto = { LegalName: 'Org' };
    const org = ShippingAgentMapper.toOrganization(dto);
    expect(org.address).toBeUndefined();
  });

  it('normalizes representative id and name from variant keys', () => {
    const dto = { representativeId: 'rX', representativeName: 'NameX', CitizenId: 'AB12345678' };
    const rep = ShippingAgentMapper.toRepresentative(dto);
    expect(rep.id).toBe('rX');
    expect(rep.name).toBe('NameX');
    expect(rep.citizenId).toBe('AB12345678');
  });

  it('maps taxNumber across multiple possible keys', () => {
    const variants = [
      { TaxNumber: '501234567' },
      { taxNumber: '501234567' },
      { Tax_Number: '501234567' }
    ];
    for (const variant of variants) {
      const org = ShippingAgentMapper.toOrganization({ LegalName: 'Org', ...variant });
      expect(org.taxNumber).toBe('501234567');
    }
  });

  it('maps email across casing variants', () => {
    const variants = [
      { Email: 'a@b.c' },
      { email: 'a@b.c' }
    ];
    for (const variant of variants) {
      const org = ShippingAgentMapper.toOrganization({ LegalName: 'Org', ...variant });
      expect(org.email).toBe('a@b.c');
    }
  });
});
