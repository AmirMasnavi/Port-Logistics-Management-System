export class ComplementaryTaskCategoryDto {
    constructor({ id, code, name, description, defaultDurationMinutes, expectedImpactMinutes, isActive, createdAt }) {
        this.categoryId = id;
        this.code = code;                         // ex.: "CTC001"
        this.name = name;                         // ex.: "Security Check"
        this.description = description || '';
        this.defaultDurationMinutes = defaultDurationMinutes ?? null;   // opcional
        this.expectedImpactMinutes = expectedImpactMinutes ?? null;     // opcional
        this.isActive = isActive ?? true;
        this.createdAt = createdAt;
    }
}

export class CreateComplementaryTaskCategoryDto {
    constructor({ code, name, description, defaultDurationMinutes, expectedImpactMinutes, isActive }) {
        this.code = code;                               // obrigatório e único
        this.name = name;                               // obrigatório
        this.description = description || '';
        this.defaultDurationMinutes = defaultDurationMinutes ?? null;
        this.expectedImpactMinutes = expectedImpactMinutes ?? null;
        this.isActive = isActive ?? true;
    }
}

export class UpdateComplementaryTaskCategoryDto {
    constructor({ name, description, defaultDurationMinutes, expectedImpactMinutes, isActive }) {
        if (name !== undefined) this.name = name;
        if (description !== undefined) this.description = description;
        if (defaultDurationMinutes !== undefined) this.defaultDurationMinutes = defaultDurationMinutes;
        if (expectedImpactMinutes !== undefined) this.expectedImpactMinutes = expectedImpactMinutes;
        if (isActive !== undefined) this.isActive = isActive;
    }
}

export class ComplementaryTaskCategoryFilterDto {
    constructor({ code, nameContains, active, minImpactMinutes, maxImpactMinutes }) {
        if (code !== undefined) this.code = code;                         // pesquisa por código exato
        if (nameContains !== undefined) this.nameContains = nameContains; // pesquisa por parte do nome
        if (active !== undefined) this.active = active;                   // true/false
        if (minImpactMinutes !== undefined) this.minImpactMinutes = minImpactMinutes;
        if (maxImpactMinutes !== undefined) this.maxImpactMinutes = maxImpactMinutes;
    }
}