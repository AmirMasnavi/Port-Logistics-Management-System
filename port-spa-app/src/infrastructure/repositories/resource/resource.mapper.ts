import type { Resource } from '../../../domain/resource/resource.model';

// Mapper to translate API DTOs into Domain Models.
// In simple cases, the API DTO might be identical to the Domain Model.

export class ResourceMapper {
    public static toDomain(apiDto: any): Resource {
        // If translation was needed, it would happen here.
        // For now, we assume the API DTO matches our Domain Model.
        return apiDto as Resource;
    }

    public static toDomainList(apiDtoList: any[]): Resource[] {
        return apiDtoList.map(this.toDomain);
    }
}

