export interface CreateComplementaryTaskDto {
    categoryId: string;
    vveId: string;
    description?: string;
    responsibleTeam: string;
    startTime: string; // ISO 8601
    endTime?: string | null; // ISO 8601
    status?: 'PENDING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
    suspendsOperations?: boolean;
}

export interface UpdateComplementaryTaskDto {
    categoryId?: string;
    description?: string;
    responsibleTeam?: string;
    startTime?: string; // ISO 8601
    endTime?: string | null; // ISO 8601
    status?: 'PENDING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
    suspendsOperations?: boolean;
}

