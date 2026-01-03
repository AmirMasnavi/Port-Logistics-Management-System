import type { ComplementaryTask } from '../../../domain/complementaryTasks/complementaryTasks.model';
import type { CreateComplementaryTaskDto, UpdateComplementaryTaskDto } from './complementaryTasks.dto';
import { oemClient } from '../../../services/apiService';

export interface ComplementaryTaskFilters {
    vveId?: string;
    categoryId?: string;
    status?: 'PENDING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
    suspendsOperations?: boolean;
    responsibleTeam?: string;
    startTimeFrom?: string;
    startTimeTo?: string;
}

export interface IComplementaryTaskRepository {
    getAll(filters?: ComplementaryTaskFilters): Promise<ComplementaryTask[]>;
    getById(id: string): Promise<ComplementaryTask>;
    getByVveId(vveId: string): Promise<ComplementaryTask[]>;
    getImpacting(): Promise<ComplementaryTask[]>;
    create(dto: CreateComplementaryTaskDto): Promise<ComplementaryTask>;
    update(id: string, dto: UpdateComplementaryTaskDto): Promise<ComplementaryTask>;
    delete(id: string): Promise<void>;
}

export class ComplementaryTaskApiRepository implements IComplementaryTaskRepository {
    private readonly baseUrl = '/complementary-tasks';

    async getAll(filters?: ComplementaryTaskFilters): Promise<ComplementaryTask[]> {
        const params = new URLSearchParams();
        if (filters?.vveId) params.append('vveId', filters.vveId);
        if (filters?.categoryId) params.append('categoryId', filters.categoryId);
        if (filters?.status) params.append('status', filters.status);
        if (filters?.suspendsOperations !== undefined) params.append('suspendsOperations', String(filters.suspendsOperations));
        if (filters?.responsibleTeam) params.append('responsibleTeam', filters.responsibleTeam);
        if (filters?.startTimeFrom) params.append('startTimeFrom', filters.startTimeFrom);
        if (filters?.startTimeTo) params.append('startTimeTo', filters.startTimeTo);

        const queryString = params.toString();
        const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
        
        const response = await oemClient.get(url);
        return response.data.data || [];
    }

    async getById(id: string): Promise<ComplementaryTask> {
        const response = await oemClient.get(`${this.baseUrl}/${id}`);
        return response.data.data;
    }

    async getByVveId(vveId: string): Promise<ComplementaryTask[]> {
        const response = await oemClient.get(`${this.baseUrl}/vve/${vveId}`);
        return response.data.data || [];
    }

    async getImpacting(): Promise<ComplementaryTask[]> {
        const response = await oemClient.get(`${this.baseUrl}/impacting`);
        return response.data.data || [];
    }

    async create(dto: CreateComplementaryTaskDto): Promise<ComplementaryTask> {
        const response = await oemClient.post(this.baseUrl, dto);
        return response.data.data;
    }

    async update(id: string, dto: UpdateComplementaryTaskDto): Promise<ComplementaryTask> {
        const response = await oemClient.put(`${this.baseUrl}/${id}`, dto);
        return response.data.data;
    }

    async delete(id: string): Promise<void> {
        await oemClient.delete(`${this.baseUrl}/${id}`);
    }
}

export const complementaryTaskApiRepository = new ComplementaryTaskApiRepository();

