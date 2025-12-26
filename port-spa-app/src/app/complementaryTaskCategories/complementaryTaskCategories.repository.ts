import type { ComplementaryTaskCategory } from '../../domain/complementaryTaskCategories/complementaryTaskCategories.model';
import type {
    CreateComplementaryTaskCategoryDto,
    UpdateComplementaryTaskCategoryDto,
} from '../../infrastructure/repositories/complementaryTaskCategories/complementaryTaskCategories.dto';

export interface ComplementaryTaskCategoryFilters {
    code?: string;
    nameContains?: string;
    active?: boolean;
    minImpactMinutes?: number;
    maxImpactMinutes?: number;
}

export interface IComplementaryTaskCategoryRepository {
    getAll(filters?: ComplementaryTaskCategoryFilters): Promise<ComplementaryTaskCategory[]>;
    getById(id: string): Promise<ComplementaryTaskCategory>;
    create(dto: CreateComplementaryTaskCategoryDto): Promise<ComplementaryTaskCategory>;
    update(id: string, dto: UpdateComplementaryTaskCategoryDto): Promise<ComplementaryTaskCategory>;
    delete(id: string): Promise<boolean>;
}