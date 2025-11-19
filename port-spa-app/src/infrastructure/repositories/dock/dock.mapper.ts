// Mapper to convert between API DTOs and Domain Models
import type { Dock } from '../../../domain/dock/dock.model';

export class DockMapper {
    public static toDomain(apiDto: any): Dock {
        // If the API DTO shape differs from domain model, translate here
        // For now, assuming they match
        return apiDto as Dock;
    }

    public static toDomainList(apiDtoList: any[]): Dock[] {
        return apiDtoList.map(this.toDomain);
    }
}

