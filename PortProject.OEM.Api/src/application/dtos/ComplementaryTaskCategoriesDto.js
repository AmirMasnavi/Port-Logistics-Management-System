export class ComplementaryTaskCategoryDto {
    constructor({ id, code, name, description, defaultDurationMinutes, expectedImpactMinutes, isActive, createdAt, group }) {
        this.categoryId = id;
        this.code = code;                         // ex.: "CTC001"
        this.name = name;                         // ex.: "Security Check"
        this.description = description || '';
        this.defaultDurationMinutes = defaultDurationMinutes ?? null;   // opcional
        this.expectedImpactMinutes = expectedImpactMinutes ?? null;     // opcional
        this.isActive = isActive ?? true;
        this.createdAt = createdAt;
        this.group = group || 'Other';         
    }
}

export class CreateComplementaryTaskCategoryDto {
    constructor({ code, name, description, defaultDurationMinutes, expectedImpactMinutes, isActive, group }) {
        this.code = code;                               // obrigatório e único
        this.name = name;                               // obrigatório
        this.description = description || '';
        this.defaultDurationMinutes = defaultDurationMinutes ?? null;
        this.expectedImpactMinutes = expectedImpactMinutes ?? null;
        this.isActive = isActive ?? true;
        this.group = group || 'Other';                 
    }
}

export class UpdateComplementaryTaskCategoryDto {
    constructor({ name, description, defaultDurationMinutes, expectedImpactMinutes, isActive, group }) {
        if (name !== undefined) this.name = name;
        if (description !== undefined) this.description = description;
        if (defaultDurationMinutes !== undefined) this.defaultDurationMinutes = defaultDurationMinutes;
        if (expectedImpactMinutes !== undefined) this.expectedImpactMinutes = expectedImpactMinutes;
        if (isActive !== undefined) this.isActive = isActive;
        if (group !== undefined) this.group = group;    
    }
}

export class ComplementaryTaskCategoryFilterDto {
    constructor({ code, nameContains, active, defaultDurationMinutes, expectedImpactMinutes, group }) {
        if (code !== undefined) this.code = code;                         // pesquisa por código exato
        if (nameContains !== undefined) this.nameContains = nameContains; // pesquisa por parte do nome
        if (active !== undefined) this.active = active;                   // true/false
        if (defaultDurationMinutes !== undefined) this.defaultDurationMinutes = defaultDurationMinutes;
        if (expectedImpactMinutes !== undefined) this.expectedImpactMinutes = expectedImpactMinutes;
        if (group !== undefined) this.group = group;
    }
}