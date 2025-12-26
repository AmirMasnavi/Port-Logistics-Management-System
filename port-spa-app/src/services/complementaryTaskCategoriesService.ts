// Service singleton for Complementary Task Category management
// This file provides a simple interface for components to use

import { ComplementaryTaskCategoryService } from '../app/complementaryTaskCategories/complementaryTaskCategories.service';
import { complementaryTaskCategoryApiRepository } from '../infrastructure/repositories/complementaryTaskCategories/complementaryTaskCategoriesApi.repository';
import type { ComplementaryTaskCategoryFilters } from '../app/complementaryTaskCategories/complementaryTaskCategories.repository';
import type {
    CreateComplementaryTaskCategoryDto,
    UpdateComplementaryTaskCategoryDto
} from '../infrastructure/repositories/complementaryTaskCategories/complementaryTaskCategories.dto';

// Create singleton instance
const complementaryService = new ComplementaryTaskCategoryService(complementaryTaskCategoryApiRepository);

// Export convenience methods
export const getComplementaryTaskCategories = (filters?: ComplementaryTaskCategoryFilters) =>
    complementaryService.fetchAllCategories(filters);

export const getComplementaryTaskCategoryById = (id: string) =>
    complementaryService.getCategoryById(id);

export const createComplementaryTaskCategory = (dto: CreateComplementaryTaskCategoryDto) =>
    complementaryService.createCategory(dto);

export const updateComplementaryTaskCategory = (id: string, dto: UpdateComplementaryTaskCategoryDto) =>
    complementaryService.updateCategory(id, dto);

export const deleteComplementaryTaskCategory = (id: string) =>
    complementaryService.deleteCategory(id);

// Export types for convenience
export type { ComplementaryTaskCategoryFilters };
export type { CreateComplementaryTaskCategoryDto, UpdateComplementaryTaskCategoryDto };