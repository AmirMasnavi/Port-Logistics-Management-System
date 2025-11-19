// src/app/vessel/vessel.service.ts
import type { Vessel } from '../../domain/vessel/vessel.model';
import type { CreateVesselDto, UpdateVesselDto } from '../../infrastructure/repositories/vessel/vessel.dto';
import type { IVesselRepository } from './vessel.repository';
import { VesselValidationError } from '../../domain/vessel/vessel.errors';

export class VesselService {
    private repository: IVesselRepository;

    constructor(repository: IVesselRepository) {
        this.repository = repository;
    }

    public async getAllVessels(): Promise<Vessel[]> {
        return await this.repository.getAll();
    }

    public async getVesselById(id: string): Promise<Vessel> {
        if (!id || id.trim() === '') {
            throw new VesselValidationError('Vessel ID is required');
        }
        return await this.repository.getById(id);
    }

    public async createVessel(dto: CreateVesselDto): Promise<Vessel> {
        this.validateCreateDto(dto);
        return await this.repository.create(dto);
    }

    public async updateVessel(id: string, dto: UpdateVesselDto): Promise<Vessel> {
        if (!id || id.trim() === '') {
            throw new VesselValidationError('Vessel ID is required');
        }
        this.validateUpdateDto(dto);
        return await this.repository.update(id, dto);
    }

    public async deleteVessel(id: string): Promise<void> {
        if (!id || id.trim() === '') {
            throw new VesselValidationError('Vessel ID is required');
        }
        await this.repository.delete(id);
    }

    private validateCreateDto(dto: CreateVesselDto): void {
        if (!dto.imoNumber || !/^\d{7}$/.test(dto.imoNumber.trim())) {
            throw new VesselValidationError('A valid 7-digit IMO Number is required.');
        }
        if (!dto.name || dto.name.trim() === '') {
            throw new VesselValidationError('Vessel name is required.');
        }
        if (!dto.operator || dto.operator.trim() === '') {
            throw new VesselValidationError('Operator is required.');
        }
        if (!dto.vesselTypeId || dto.vesselTypeId.trim() === '') {
            throw new VesselValidationError('A Vessel Type must be selected.');
        }
    }

    private validateUpdateDto(dto: UpdateVesselDto): void {
        if (dto.name !== undefined && dto.name.trim() === '') {
            throw new VesselValidationError('Vessel name cannot be empty.');
        }
        if (dto.operator !== undefined && dto.operator.trim() === '') {
            throw new VesselValidationError('Operator cannot be empty.');
        }
    }
}