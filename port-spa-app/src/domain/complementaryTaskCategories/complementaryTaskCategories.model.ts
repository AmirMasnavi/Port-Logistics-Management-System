export interface ComplementaryTaskCategory {
    categoryId: string; // Business ID (CTC-YYYY-XXXXXX)
    code: string; // Código único (ex.: CTC001)
    name: string; // Nome da categoria (ex.: Security Check)
    description?: string; // Breve descrição
    defaultDurationMinutes?: number | null; // Duração padrão (opcional)
    expectedImpactMinutes?: number | null; // Impacto esperado (opcional)
    isActive: boolean; // Ativo/inativo
    createdAt?: string; // ISO Date
    group?: string; 
}