import type {ComplementaryTaskCategoryResponseDto} from "./complementaryTaskCategories.dto.ts";
import type { ComplementaryTaskCategory } from '../../../domain/complementaryTaskCategories/complementaryTaskCategories.model';


export class ComplementaryTaskCategoryMapper {
    static toDomain(dto: ComplementaryTaskCategoryResponseDto): ComplementaryTaskCategory {
        return {
            categoryId: dto.categoryId,
            code: dto.code,
            name: dto.name,
            description: dto.description ?? '',
            defaultDurationMinutes: dto.defaultDurationMinutes ?? null,
            expectedImpactMinutes: dto.expectedImpactMinutes ?? null,
            isActive: dto.isActive,
            createdAt: dto.createdAt,
        };
    }

    static toDomainList(dtos: ComplementaryTaskCategoryResponseDto[]): ComplementaryTaskCategory[] {
        return dtos.map(dto => this.toDomain(dto));
    }
}