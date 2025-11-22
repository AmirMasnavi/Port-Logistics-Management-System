import { describe, it, expect } from 'vitest';
import { ShippingAgentService } from '../../../app/shippingAgent/shippingAgent.service';
import { ShippingAgentValidationError } from '../../../domain/shippingAgent/shippingAgent.errors';
import type { IShippingAgentRepository } from '../../../app/shippingAgent/shippingAgent.repository';

const makeRepo = (data: { reps: any[] }) : IShippingAgentRepository => ({
  getAllOrganizations: async () => [] as any,
  getAllRepresentatives: async () => data.reps as any,
  createOrganization: async () => ({ id: 'org', name: 'Org' } as any),
  createRepresentative: async () => ({ id: 'rep-new', name: 'New', citizenId: 'NEWCID' } as any),
  updateRepresentative: async (_cid: string, dto: any) => ({ id: 'rep-upd', name: dto.RepresentativeName, citizenId: dto.CitizenId, email: dto.RepresentativeEmail } as any),
  deleteRepresentative: async () => {}
});

describe('ShippingAgentService update/delete representative', () => {
  it('allows keeping same email when updating same citizenId', async () => {
    const existingEmail = 'rep@x.com';
    const service = new ShippingAgentService(makeRepo({ reps: [{ id: 'r1', name: 'R1', citizenId: 'AB12345678', email: existingEmail }] }));
    const updated = await service.updateRepresentative('AB12345678', {
      RepresentativeName: 'R1 Edit', CitizenId: 'AB12345678', RepresentativeNationality: 'Portuguese', RepresentativeEmail: existingEmail, RepresentativePhone: '923456789', OrganizationName: 'Org'
    });
    expect(updated.name).toBe('R1 Edit');
  });

  it('rejects using another representative email during update', async () => {
    const service = new ShippingAgentService(makeRepo({ reps: [
      { id: 'r1', name: 'R1', citizenId: 'AB12345678', email: 'first@x.com' },
      { id: 'r2', name: 'R2', citizenId: 'CD23456789', email: 'second@x.com' }
    ] }));
    await expect(service.updateRepresentative('AB12345678', {
      RepresentativeName: 'R1 Edit', CitizenId: 'AB12345678', RepresentativeNationality: 'Portuguese', RepresentativeEmail: 'second@x.com', RepresentativePhone: '923456789', OrganizationName: 'Org'
    })).rejects.toThrow(/already exists/i);
  });

  it('rejects delete with empty citizenId', async () => {
    const service = new ShippingAgentService(makeRepo({ reps: [] }));
    await expect(service.deleteRepresentative('')).rejects.toThrow(ShippingAgentValidationError);
  });

  it('deletes representative successfully', async () => {
    const service = new ShippingAgentService(makeRepo({ reps: [{ id: 'r1', name: 'R1', citizenId: 'AB12345678', email: 'e@x.com' }] }));
    await expect(service.deleteRepresentative('AB12345678')).resolves.toBeUndefined();
  });
});


describe('ShippingAgentService duplicate rep emails within organization DTO', () => {
  it('rejects two reps with same email inside createOrganization payload', async () => {
    const service = new ShippingAgentService(makeRepo({ reps: [] }));
    await expect(service.createOrganization({
      LegalName: 'Org', AlternativeName: 'Org', Street: 'S', City: 'C', Country: 'PT', Email: 'org@x.com', Phone: '912345678', TaxNumber: '501234567', Representatives: [
        { RepresentativeName: 'R1', CitizenId: 'AB12345678', RepresentativeNationality: 'Portuguese', RepresentativeEmail: 'dup@x.com', RepresentativePhone: '923456789' },
        { RepresentativeName: 'R2', CitizenId: 'CD23456789', RepresentativeNationality: 'Portuguese', RepresentativeEmail: 'dup@x.com', RepresentativePhone: '933456789' }
      ]
    })).rejects.toThrow(/unique/i);
  });
});

