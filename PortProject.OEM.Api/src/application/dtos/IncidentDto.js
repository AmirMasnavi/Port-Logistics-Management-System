export class IncidentDto {
    constructor(id, title, typeId, severity, status, start, end, duration, affectedVves, description, author, createdAt) {
        this.incidentId = id;
        this.title = title;
        this.incidentTypeId = typeId;
        this.severity = severity;
        this.status = status;
        this.startTime = start;
        this.endTime = end;
        this.durationMinutes = duration;
        this.affectedVves = affectedVves || [];
        this.description = description;
        this.createdBy = author;
        this.createdAt = createdAt;
    }
}

export class CreateIncidentDto {
    constructor({ title, incidentTypeId, severity, startTime, description, affectedVves }) {
        this.title = title;
        this.incidentTypeId = incidentTypeId;
        this.severity = severity;
        this.startTime = startTime;
        this.description = description;
        this.affectedVves = affectedVves || [];
    }
}

export class UpdateIncidentDto {
    constructor({ title, description, severity, status, endTime, affectedVves }) {
        if (title !== undefined) this.title = title;
        if (description !== undefined) this.description = description;
        if (severity !== undefined) this.severity = severity;
        if (status !== undefined) this.status = status;
        if (endTime !== undefined) this.endTime = endTime;
        if (affectedVves !== undefined) this.affectedVves = affectedVves;
    }
}

