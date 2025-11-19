// Mapper to convert between API DTOs and Domain Models
import type { Vessel } from '../../../domain/vessel/vessel.model';

export class VesselMapper {
    public static toDomain(apiDto: any): Vessel {
        // If the API DTO shape differs from domain model, translate here
        // For now, assuming they match
        return apiDto as Vessel;
    }

    public static toDomainList(apiDtoList: any[]): Vessel[] {
        return apiDtoList.map(this.toDomain);
    }
}

