export interface ComplementaryTaskCategoryResponseDto {
    categoryId: string;
    code: string;
    name: string;
    description?: string;
    defaultDurationMinutes?: number | null;
    expectedImpactMinutes?: number | null;
    isActive: boolean;
    createdAt?: string;
    group?: string;
}

export interface CreateComplementaryTaskCategoryDto {
    code: string;
    name: string;
    description?: string;
    defaultDurationMinutes?: number | null;
    expectedImpactMinutes?: number | null;
    isActive?: boolean;
    group?: string;
}

export interface UpdateComplementaryTaskCategoryDto {
    name?: string;
    description?: string;
    defaultDurationMinutes?: number | null;
    expectedImpactMinutes?: number | null;
    isActive?: boolean;
    group?: string;
}