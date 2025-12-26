export interface ComplementaryTaskCategoryResponseDto {
    categoryId: string;
    code: string;
    name: string;
    description?: string;
    defaultDurationMinutes?: number | null;
    expectedImpactMinutes?: number | null;
    isActive: boolean;
    createdAt?: string;
}

export interface CreateComplementaryTaskCategoryDto {
    code: string;
    name: string;
    description?: string;
    defaultDurationMinutes?: number | null;
    expectedImpactMinutes?: number | null;
    isActive?: boolean;
}

export interface UpdateComplementaryTaskCategoryDto {
    name?: string;
    description?: string;
    defaultDurationMinutes?: number | null;
    expectedImpactMinutes?: number | null;
    isActive?: boolean;
}