export interface ComplementaryTask {
    taskId: string; // Business ID (CT-YYYY-XXXXXX)
    categoryId: string; // Reference to Complementary Task Category
    vveId: string; // Reference to Vessel Visit Execution
    description?: string; // Optional task description
    responsibleTeam: string; // Team or service responsible (e.g., "Safety Team")
    startTime: string; // ISO Date
    endTime?: string | null; // ISO Date (optional until completed)
    status: 'PENDING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
    suspendsOperations: boolean; // true = suspends cargo operations
    durationMinutes?: number | null; // Auto-calculated duration
    createdBy?: string;
    createdAt?: string; // ISO Date
    updatedBy?: string | null;
    updatedAt?: string | null;
}

