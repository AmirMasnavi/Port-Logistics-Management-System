import { apiClient } from '../../../services/apiService';
import type { IDockRepository } from '../../../app/dock/dock.repository';
import type { Dock } from '../../../domain/dock/dock.model';
import type { DockCreateDto } from './dock.dto';

export class DockApiRepository implements IDockRepository {

    public async getAll(): Promise<Dock[]> {
        // Usa 'apiClient' e NÃO 'axios.get'
        const response = await apiClient.get<Dock[]>('/Dock');
        return response.data;
    }

    public async getById(id: string): Promise<Dock> {
        const response = await apiClient.get<Dock>(`/Dock/${id}`);
        return response.data;
    }

    public async create(dto: DockCreateDto): Promise<Dock> {
        const response = await apiClient.post<Dock>('/Dock', dto);
        return response.data;
    }

    public async update(id: string, dto: any): Promise<Dock> {
        const response = await apiClient.put<Dock>(`/Dock/${id}`, dto);
        return response.data;
    }

    public async delete(id: string): Promise<void> {
        await apiClient.delete(`/Dock/${id}`);
    }
}

export const dockApiRepository = new DockApiRepository();