import type { StorageArea } from '../../../domain/storageArea/storageArea.model';

// Mapper to translate API DTOs into Domain Models.
// In simple cases, the API DTO might be identical to the Domain Model.

export class StorageAreaMapper {
    public static toDomain(apiDto: any): StorageArea {
        // If translation was needed, it would happen here.
        // For now, we assume the API DTO matches our Domain Model.
        return apiDto as StorageArea;
    }

    public static toDomainList(apiDtoList: any[]): StorageArea[] {
        return apiDtoList.map(this.toDomain);
    }
}
