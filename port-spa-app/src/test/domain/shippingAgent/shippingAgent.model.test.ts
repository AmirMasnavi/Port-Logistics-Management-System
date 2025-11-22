import { describe, it, expect } from 'vitest';
import type { ShippingAgentOrganization, ShippingAgentRepresentative, ShippingAgentAggregate } from '../../../domain/shippingAgent/shippingAgent.model';

// Testes de modelo de domínio (interfaces simples) para assegurar expectativas de estrutura.
// Embora interfaces não tenham lógica em runtime, estes testes ajudam a garantir que o
// layout usado pelo restante código (mappers, service, controller) não foi alterado inadvertidamente.

describe('ShippingAgent domain models', () => {
  it('represents a complete organization', () => {
    const org: ShippingAgentOrganization = {
      id: 'org-1',
      name: 'Atlantic Maritime Logistics',
      address: 'Rua do Porto 123, Porto, Portugal',
      email: 'contact@atlantic-maritime.example',
      phone: '912345678',
      taxNumber: '501234567'
    };
    expect(org.id).toBe('org-1');
    expect(org.name).toMatch(/Atlantic Maritime/);
    expect(org.address).toContain('Porto');
    expect(org.taxNumber).toMatch(/^[0-9A-Z]{6,}$/);
  });

  it('allows optional organization fields to be undefined', () => {
    const org: ShippingAgentOrganization = {
      id: 'org-2',
      name: 'Org Without Optionals'
    };
    expect(org.email).toBeUndefined();
    expect(org.phone).toBeUndefined();
    expect(org.address).toBeUndefined();
    expect(org.taxNumber).toBeUndefined();
  });

  it('represents a complete representative', () => {
    const rep: ShippingAgentRepresentative = {
      id: 'rep-1',
      name: 'Maria Santos',
      citizenId: 'AB12345678',
      nationality: 'Portuguese',
      email: 'maria.santos@atlantic-maritime.example',
      phone: '934567890',
      organizationId: 'org-1',
      organizationName: 'Atlantic Maritime Logistics'
    };
    expect(rep.citizenId).toMatch(/^[A-Z0-9.-]{8,}$/i); // padrão usado pelo service
    expect(rep.organizationName).toBeDefined();
    expect(rep.phone?.length).toBe(9);
  });

  it('allows optional representative fields to be undefined', () => {
    const rep: ShippingAgentRepresentative = {
      id: 'rep-2',
      name: 'João Silva',
      citizenId: 'CD23456789'
    };
    expect(rep.email).toBeUndefined();
    expect(rep.phone).toBeUndefined();
    expect(rep.nationality).toBeUndefined();
    expect(rep.organizationId).toBeUndefined();
    expect(rep.organizationName).toBeUndefined();
  });

  it('aggregate model groups orgs and reps', () => {
    const aggregate: ShippingAgentAggregate = {
      organizations: [ { id: 'o1', name: 'Org1' } ],
      representatives: [ { id: 'r1', name: 'Rep1', citizenId: 'AA123456', organizationId: 'o1', organizationName: 'Org1' } ]
    };
    expect(aggregate.organizations[0].name).toBe('Org1');
    expect(aggregate.representatives[0].organizationName).toBe('Org1');
  });

  it('citizenId pattern accepts uppercase, lowercase and separators', () => {
    const examples = ['AB12345678', 'ab12345678', 'A1B2C3D4', 'AB-123.456'];
    for (const cid of examples) {
      expect(cid).toMatch(/^[A-Za-z0-9.-]{8,}$/); // mesmo regex usado no service
    }
  });
});
