import type { ComplementaryTaskCategory } from '../../domain/complementaryTaskCategories/complementaryTaskCategories.model';
import { ComplementaryTaskCategoryValidationError } from '../../domain/complementaryTaskCategories/complementaryTaskCategories.error';
import type {
    IComplementaryTaskCategoryRepository,
    ComplementaryTaskCategoryFilters,
} from './complementaryTaskCategories.repository';
import type {
    CreateComplementaryTaskCategoryDto,
    UpdateComplementaryTaskCategoryDto,
} from '../../infrastructure/repositories/complementaryTaskCategories/complementaryTaskCategories.dto';

export class ComplementaryTaskCategoryService {
    private readonly repo: IComplementaryTaskCategoryRepository;

    constructor(repo: IComplementaryTaskCategoryRepository) {
        this.repo = repo;
    }

    /**
     * Fetch categories with optional filters
     */
    async fetchAllCategories(filters?: ComplementaryTaskCategoryFilters): Promise<ComplementaryTaskCategory[]> {
        const items = await this.repo.getAll(filters);
        // Business rule: sort by createdAt desc, fallback to name
        return items.sort((a, b) => {
            const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            if (db !== da) return db - da;
            return a.name.localeCompare(b.name);
        });
    }

    /**
     * Get category by ID
     */
    async getCategoryById(id: string): Promise<ComplementaryTaskCategory> {
        if (!id || id.trim().length === 0) {
            throw new ComplementaryTaskCategoryValidationError('Category ID is required');
        }
        return this.repo.getById(id);
    }

    /**
     * Create new category
     */
    async createCategory(dto: CreateComplementaryTaskCategoryDto): Promise<ComplementaryTaskCategory> {
        this.validateCreateDto(dto);
        return this.repo.create(dto);
    }

    /**
     * Update existing category
     */
    async updateCategory(id: string, dto: UpdateComplementaryTaskCategoryDto): Promise<ComplementaryTaskCategory> {
        if (!id || id.trim().length === 0) {
            throw new ComplementaryTaskCategoryValidationError('Category ID is required');
        }
        // Ensure existence
        await this.repo.getById(id);
        this.validateUpdateDto(dto);
        return this.repo.update(id, dto);
    }

    /**
     * Delete category
     */
    async deleteCategory(id: string): Promise<boolean> {
        if (!id || id.trim().length === 0) {
            throw new ComplementaryTaskCategoryValidationError('Category ID is required');
        }
        // Ensure existence
        await this.repo.getById(id);
        return this.repo.delete(id);
    }

    // --- Private validations ---

    private validateCreateDto(dto: CreateComplementaryTaskCategoryDto): void {
        const errors: string[] = [];

        if (!dto.code || dto.code.trim().length === 0) {
            errors.push('Code is required');
        }
        if (!dto.name || dto.name.trim().length === 0) {
            errors.push('Name is required');
        }
        if (dto.defaultDurationMinutes !== undefined && dto.defaultDurationMinutes !== null) {
            if (!Number.isInteger(dto.defaultDurationMinutes) || dto.defaultDurationMinutes < 0) {
                errors.push('defaultDurationMinutes must be a non-negative integer');
            }
        }
        if (dto.expectedImpactMinutes !== undefined && dto.expectedImpactMinutes !== null) {
            if (!Number.isInteger(dto.expectedImpactMinutes) || dto.expectedImpactMinutes < 0) {
                errors.push('expectedImpactMinutes must be a non-negative integer');
            }
        }
        if (dto.isActive !== undefined && typeof dto.isActive !== 'boolean') {
            errors.push('isActive must be a boolean');
        }
        if (dto.group !== undefined && dto.group.trim().length === 0) {
            errors.push('group cannot be empty');
        }
        if (errors.length > 0) {
            throw new ComplementaryTaskCategoryValidationError(errors.join(', '));
        }
    }

    private validateUpdateDto(dto: UpdateComplementaryTaskCategoryDto): void {
        const errors: string[] = [];

        if (dto.name !== undefined && dto.name.trim().length === 0) {
            errors.push('Name cannot be empty');
        }
        if (dto.defaultDurationMinutes !== undefined && dto.defaultDurationMinutes !== null) {
            if (!Number.isInteger(dto.defaultDurationMinutes) || dto.defaultDurationMinutes < 0) {
                errors.push('defaultDurationMinutes must be a non-negative integer');
            }
        }
        if (dto.expectedImpactMinutes !== undefined && dto.expectedImpactMinutes !== null) {
            if (!Number.isInteger(dto.expectedImpactMinutes) || dto.expectedImpactMinutes < 0) {
                errors.push('expectedImpactMinutes must be a non-negative integer');
            }
        }
        if (dto.isActive !== undefined && typeof dto.isActive !== 'boolean') {
            errors.push('isActive must be a boolean');
        }
        if (dto.group !== undefined && dto.group.trim().length === 0) {
            errors.push('group cannot be empty');
        }
        if (errors.length > 0) {
            throw new ComplementaryTaskCategoryValidationError(errors.join(', '));
        }
    }
}