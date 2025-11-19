import type { IShippingAgentRepository } from './shippingAgent.repository';
import type { ShippingAgentOrganization, ShippingAgentRepresentative } from '../../domain/shippingAgent/shippingAgent.model';
import type { CreateShippingAgentOrganizationDto, CreateShippingAgentRepresentativeDto, UpdateShippingAgentRepresentativeDto } from '../../infrastructure/repositories/shippingAgent/shippingAgent.dto';
import { ShippingAgentValidationError } from '../../domain/shippingAgent/shippingAgent.errors';

// Business logic layer (Use Cases)
export class ShippingAgentService {
  private readonly repo: IShippingAgentRepository; // replaced parameter property (not allowed under erasableSyntaxOnly)
  constructor(repo: IShippingAgentRepository) { this.repo = repo; }

  async fetchAll(): Promise<{ organizations: ShippingAgentOrganization[]; representatives: ShippingAgentRepresentative[] }> {
    const [orgs, reps] = await Promise.all([
      this.repo.getAllOrganizations(),
      this.repo.getAllRepresentatives()
    ]);
    return { organizations: orgs, representatives: reps };
  }

  // --- Basic validations (shared) ---
  isValidEmail(v: string): boolean { return /.+@.+\..+/.test(v.trim()); }
  isValidPtMobile(v: string): boolean { return /^9\d{8}$/.test(v.trim()); }
  isValidCitizenId(v: string): boolean { const s = (v ?? '').toString().trim(); return s.length >= 8 && /^[A-Za-z0-9.-]+$/.test(s); }
  isValidOrgTaxNumber(v: string): boolean { const val = v.trim().toUpperCase(); return (/^[1-9][0-9]{8}$/.test(val) || /^[A-Z]{2}[0-9A-Z]{8,12}$/.test(val) || /^[A-Z0-9]{8,15}$/.test(val)); }

  validateCreateOrganization(dto: CreateShippingAgentOrganizationDto) {
    if (!dto.LegalName.trim()) throw new ShippingAgentValidationError('Organization name is required.');
    if (!this.isValidOrgTaxNumber(dto.TaxNumber)) throw new ShippingAgentValidationError('Organization tax number is invalid.');
    if (!this.isValidEmail(dto.Email)) throw new ShippingAgentValidationError('Organization email appears invalid.');
    if (!this.isValidPtMobile(dto.Phone)) throw new ShippingAgentValidationError('Organization phone must start with 9 and have 9 digits.');
    if (!dto.Representatives.length) throw new ShippingAgentValidationError('At least one representative is required.');
    for (const rep of dto.Representatives) {
      if (!rep.RepresentativeName.trim()) throw new ShippingAgentValidationError('Initial representative name is required.');
      if (!this.isValidCitizenId(rep.CitizenId)) throw new ShippingAgentValidationError('Initial representative Citizen ID format is invalid.');
      if (!rep.RepresentativeNationality.trim()) throw new ShippingAgentValidationError('Initial representative nationality is required.');
      if (!this.isValidPtMobile(rep.RepresentativePhone)) throw new ShippingAgentValidationError('Initial representative phone must start with 9 and have 9 digits.');
      if (!this.isValidEmail(rep.RepresentativeEmail)) throw new ShippingAgentValidationError('Initial representative email appears invalid.');
    }
  }

  async createOrganization(dto: CreateShippingAgentOrganizationDto): Promise<ShippingAgentOrganization> {
    this.validateCreateOrganization(dto);
    return this.repo.createOrganization(dto);
  }

  validateCreateRepresentative(dto: CreateShippingAgentRepresentativeDto) {
    if (!dto.RepresentativeName.trim()) throw new ShippingAgentValidationError('Representative name is required.');
    if (!this.isValidCitizenId(dto.CitizenId)) throw new ShippingAgentValidationError('Citizen ID format is invalid; must have at least 8 alphanumeric characters.');
    if (!dto.RepresentativeNationality.trim()) throw new ShippingAgentValidationError('Representative nationality is required.');
    if (dto.RepresentativePhone && !/^\d{8,}$/.test(dto.RepresentativePhone.trim())) throw new ShippingAgentValidationError('Phone must contain at least 8 digits.');
    if (dto.RepresentativePhone && !dto.RepresentativePhone.trim().startsWith('9')) throw new ShippingAgentValidationError('Phone number must start with 9.');
    if (dto.RepresentativeEmail && !this.isValidEmail(dto.RepresentativeEmail)) throw new ShippingAgentValidationError('Provided email appears invalid.');
    if (!dto.OrganizationName.trim()) throw new ShippingAgentValidationError('Organization name is required.');
  }

  async createRepresentative(dto: CreateShippingAgentRepresentativeDto): Promise<ShippingAgentRepresentative> {
    this.validateCreateRepresentative(dto);
    return this.repo.createRepresentative(dto);
  }

  validateUpdateRepresentative(dto: UpdateShippingAgentRepresentativeDto) {
    this.validateCreateRepresentative(dto); // same checks
  }

  async updateRepresentative(citizenId: string, dto: UpdateShippingAgentRepresentativeDto): Promise<ShippingAgentRepresentative> {
    this.validateUpdateRepresentative(dto);
    return this.repo.updateRepresentative(citizenId, dto);
  }

  async deleteRepresentative(citizenId: string): Promise<void> {
    if (!citizenId) throw new ShippingAgentValidationError('Citizen ID required for deletion.');
    return this.repo.deleteRepresentative(citizenId);
  }
}
