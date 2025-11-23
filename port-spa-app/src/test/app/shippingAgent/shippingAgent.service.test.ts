import { describe, it, expect } from 'vitest';
import { ShippingAgentService } from '../../../app/shippingAgent/shippingAgent.service';
import { ShippingAgentValidationError } from '../../../domain/shippingAgent/shippingAgent.errors';
import type { IShippingAgentRepository } from '../../../app/shippingAgent/shippingAgent.repository';

const makeRepo = (seed: { orgEmails?: string[]; repEmails?: string[] }): IShippingAgentRepository => {
  const orgs = (seed.orgEmails || []).map((e, i) => ({ id: `o${i}`, name: `Org${i}`, email: e }));
  const reps = (seed.repEmails || []).map((e, i) => ({ id: `r${i}`, name: `Rep${i}`, email: e, citizenId: `CID${i}XXXX`, nationality: 'Portuguese', organizationId: 'o0', organizationName: 'Org0' }));
  return {
    getAllOrganizations: async () => orgs as any,
    getAllRepresentatives: async () => reps as any,
    createOrganization: async (dto: any) => ({ id: 'new-org', name: dto.LegalName } as any),
    createRepresentative: async (dto: any) => ({ id: 'new-rep', name: dto.RepresentativeName, citizenId: dto.CitizenId } as any),
    updateRepresentative: async () => ({ id: 'upd-rep', name: 'Updated', citizenId: 'X' } as any),
    deleteRepresentative: async () => {}
  };
};

describe('ShippingAgentService validations', () => {
  it('rejects invalid organization tax number', async () => {
    const service = new ShippingAgentService(makeRepo({ orgEmails: [], repEmails: [] }));
    await expect(service.createOrganization({
      LegalName: 'Org', AlternativeName: 'Org', Street: 'S', City: 'C', Country: 'PT', Email: 'a@b.c', Phone: '912345678', TaxNumber: '00', Representatives: [
        { RepresentativeName: 'Rep', CitizenId: 'AB12345678', RepresentativeNationality: 'Portuguese', RepresentativeEmail: 'rep@b.c', RepresentativePhone: '923456789' }
      ]
    })).rejects.toThrow(ShippingAgentValidationError);
  });

  it('rejects duplicate email between org and representative', async () => {
    const service = new ShippingAgentService(makeRepo({ orgEmails: [], repEmails: [] }));
    await expect(service.createOrganization({
      LegalName: 'Org', AlternativeName: 'Org', Street: 'S', City: 'C', Country: 'PT', Email: 'same@b.c', Phone: '912345678', TaxNumber: '501234567', Representatives: [
        { RepresentativeName: 'Rep', CitizenId: 'AB12345678', RepresentativeNationality: 'Portuguese', RepresentativeEmail: 'same@b.c', RepresentativePhone: '923456789' }
      ]
    })).rejects.toThrow(/unique/i);
  });

  it('rejects existing email in repository (org)', async () => {
    const service = new ShippingAgentService(makeRepo({ orgEmails: ['exists@b.c'], repEmails: [] }));
    await expect(service.createOrganization({
      LegalName: 'Org', AlternativeName: 'Org', Street: 'S', City: 'C', Country: 'PT', Email: 'exists@b.c', Phone: '912345678', TaxNumber: '501234567', Representatives: [
        { RepresentativeName: 'Rep', CitizenId: 'AB12345678', RepresentativeNationality: 'Portuguese', RepresentativeEmail: 'rep@b.c', RepresentativePhone: '923456789' }
      ]
    })).rejects.toThrow(/already exists/i);
  });

  it('rejects existing email in repository (representative)', async () => {
    const service = new ShippingAgentService(makeRepo({ orgEmails: [], repEmails: ['rep@b.c'] }));
    await expect(service.createOrganization({
      LegalName: 'Org', AlternativeName: 'Org', Street: 'S', City: 'C', Country: 'PT', Email: 'org@b.c', Phone: '912345678', TaxNumber: '501234567', Representatives: [
        { RepresentativeName: 'Rep', CitizenId: 'AB12345678', RepresentativeNationality: 'Portuguese', RepresentativeEmail: 'rep@b.c', RepresentativePhone: '923456789' }
      ]
    })).rejects.toThrow(/already exists/i);
  });

  it('creates organization successfully with valid unique emails', async () => {
    const service = new ShippingAgentService(makeRepo({ orgEmails: [], repEmails: [] }));
    const created = await service.createOrganization({
      LegalName: 'Org', AlternativeName: 'Org', Street: 'S', City: 'C', Country: 'PT', Email: 'org@b.c', Phone: '912345678', TaxNumber: '501234567', Representatives: [
        { RepresentativeName: 'Rep', CitizenId: 'AB12345678', RepresentativeNationality: 'Portuguese', RepresentativeEmail: 'rep@b.c', RepresentativePhone: '923456789' }
      ]
    });
    expect(created.name).toBe('Org');
  });

  it('rejects representative invalid citizen id', async () => {
    const service = new ShippingAgentService(makeRepo({ orgEmails: [], repEmails: [] }));
    await expect(service.createRepresentative({
      RepresentativeName: 'Rep', CitizenId: 'BAD', RepresentativeNationality: 'Portuguese', RepresentativeEmail: 'rep@b.c', RepresentativePhone: '923456789', OrganizationName: 'Org'
    })).rejects.toThrow(/Citizen ID format/i);
  });

  it('creates representative successfully', async () => {
    const service = new ShippingAgentService(makeRepo({ orgEmails: [], repEmails: [] }));
    const created = await service.createRepresentative({
      RepresentativeName: 'Rep', CitizenId: 'AB12345678', RepresentativeNationality: 'Portuguese', RepresentativeEmail: 'rep@b.c', RepresentativePhone: '923456789', OrganizationName: 'Org'
    });
    expect(created.name).toBe('Rep');
  });
});

