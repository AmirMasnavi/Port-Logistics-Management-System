import { OperationPlanResponseDto } from '../dtos/OperationPlanDto.js';

export class OperationPlanMapper {
    /**
     * Convert persistence model to response DTO
     * @param {Object} model - Mongoose model instance
     * @param {Boolean} includeDetails - Whether to include full scheduledTasks and changeLogs
     */
    static toResponseDto(model, includeDetails = true) {
        const dto = {
            planId: model.planId,
            date: model.date,
            algorithm: model.algorithm,
            geneticParams: model.geneticParams,
            createdBy: model.createdBy,
            status: model.status,
            createdAt: model.createdAt,
            scheduledTasksCount: model.scheduledTasks ? model.scheduledTasks.length : 0,
            metrics: model.metrics
        };

        // Include full details when requested (for create, update operations)
        if (includeDetails) {
            dto.scheduledTasks = model.scheduledTasks;
            dto.changeLogs = model.changeLogs;
        }

        return new OperationPlanResponseDto(dto);
    }

    /**
     * Convert array of models to list of DTOs
     */
    static toListDto(models) {
        // For list views, don't include full details
        return models.map(model => this.toResponseDto(model, false));
    }
}