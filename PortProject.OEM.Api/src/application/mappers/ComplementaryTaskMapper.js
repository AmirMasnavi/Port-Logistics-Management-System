import { ComplementaryTaskDto } from '../dtos/ComplementaryTaskDto.js';

/**
 * Mapper for Complementary Task entity transformations
 */
export class ComplementaryTaskMapper {
    /**
     * Converts a domain model to a DTO
     */
    static toDto(task) {
        if (!task) return null;
        
        // Calculate duration if both start and end times exist
        let durationMinutes = null;
        if (task.endTime && task.startTime) {
            durationMinutes = Math.floor((new Date(task.endTime) - new Date(task.startTime)) / 60000);
        }

        return new ComplementaryTaskDto({
            taskId: task.taskId,
            categoryId: task.categoryId,
            vveId: task.vveId,
            description: task.description,
            responsibleTeam: task.responsibleTeam,
            startTime: task.startTime,
            endTime: task.endTime,
            status: task.status,
            suspendsOperations: task.suspendsOperations,
            durationMinutes: durationMinutes,
            createdBy: task.createdBy,
            createdAt: task.createdAt,
            updatedBy: task.updatedBy,
            updatedAt: task.updatedAt
        });
    }

    /**
     * Converts an array of domain models to DTOs
     */
    static toListDto(tasks) {
        if (!tasks || !Array.isArray(tasks)) return [];
        return tasks.map(task => ComplementaryTaskMapper.toDto(task));
    }

    /**
     * Converts a DTO to domain model data (for creation)
     */
    static toDomain(dto) {
        return {
            categoryId: dto.categoryId,
            vveId: dto.vveId,
            description: dto.description || '',
            responsibleTeam: dto.responsibleTeam,
            startTime: dto.startTime,
            endTime: dto.endTime || null,
            status: dto.status || 'PENDING',
            suspendsOperations: dto.suspendsOperations !== undefined ? dto.suspendsOperations : false
        };
    }
}

