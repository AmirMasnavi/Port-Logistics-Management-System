import { complementaryTaskApiRepository } from '../infrastructure/repositories/complementaryTasks/complementaryTasks.repository';
import { ComplementaryTaskService } from '../app/complementaryTasks/complementaryTasks.service';
import type { ComplementaryTaskFilters } from '../infrastructure/repositories/complementaryTasks/complementaryTasks.repository';
import type {
    CreateComplementaryTaskDto,
    UpdateComplementaryTaskDto
} from '../infrastructure/repositories/complementaryTasks/complementaryTasks.dto';

const complementaryTaskService = new ComplementaryTaskService(complementaryTaskApiRepository);

export const getComplementaryTasks = (filters?: ComplementaryTaskFilters) =>
    complementaryTaskService.fetchAllTasks(filters);

export const getComplementaryTaskById = (id: string) =>
    complementaryTaskService.getTaskById(id);

export const getComplementaryTasksByVveId = (vveId: string) =>
    complementaryTaskService.getTasksByVveId(vveId);

export const getImpactingTasks = () =>
    complementaryTaskService.getImpactingTasks();

export const createComplementaryTask = (dto: CreateComplementaryTaskDto) =>
    complementaryTaskService.createTask(dto);

export const updateComplementaryTask = (id: string, dto: UpdateComplementaryTaskDto) =>
    complementaryTaskService.updateTask(id, dto);

export const deleteComplementaryTask = (id: string) =>
    complementaryTaskService.deleteTask(id);

export type { ComplementaryTaskFilters };
export type { CreateComplementaryTaskDto, UpdateComplementaryTaskDto };

