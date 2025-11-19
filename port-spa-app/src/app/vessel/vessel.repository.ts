// src/app/vessel/vessel.repository.ts
import type { Vessel } from '../../domain/vessel/vessel.model';
import type { CreateVesselDto, UpdateVesselDto } from '../../infrastructure/repositories/vessel/vessel.dto';

export interface IVesselRepository {
    getAll(): Promise<Vessel[]>;
    getById(id: string): Promise<Vessel>;
    create(dto: CreateVesselDto): Promise<Vessel>;
    update(id: string, dto: UpdateVesselDto): Promise<Vessel>;
    delete(id: string): Promise<void>;
}