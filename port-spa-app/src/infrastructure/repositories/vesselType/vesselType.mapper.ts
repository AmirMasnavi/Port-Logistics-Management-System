// Mapper to convert between API DTOs and Domain Models
import type { VesselType } from '../../../domain/vesselType/vesselType.model';

export class VesselTypeMapper {
    public static toDomain(apiDto: any): VesselType {
        // If the API DTO shape differs from domain model, translate here
        // For now, assuming they match
        return apiDto as VesselType;
    }

    public static toDomainList(apiDtoList: any[]): VesselType[] {
        return apiDtoList.map(this.toDomain);
    }
}

