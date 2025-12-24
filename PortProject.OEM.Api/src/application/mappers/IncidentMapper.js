import { IncidentDto } from '../dtos/IncidentDto.js';

export class IncidentMapper {
    static toDto(model) {
        return new IncidentDto(
            model.incidentId,
            model.title,
            model.incidentTypeId,
            model.severity,
            model.status,
            model.startTime,
            model.endTime,
            model.durationMinutes,
            model.affectedVves,
            model.description,
            model.createdBy,
            model.createdAt
        );
    }

    static toListDto(models) {
        return models.map(model => this.toDto(model));
    }
}

