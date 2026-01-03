/**
 * DTOs for Complementary Task operations
 */

/**
 * DTO for creating a new Complementary Task
 */
export class CreateComplementaryTaskDto {
    constructor(data) {
        this.categoryId = data.categoryId;
        this.vveId = data.vveId;
        this.description = data.description || '';
        this.responsibleTeam = data.responsibleTeam;
        this.startTime = data.startTime;
        this.endTime = data.endTime || null;
        this.status = data.status || 'PENDING';
        this.suspendsOperations = data.suspendsOperations !== undefined ? data.suspendsOperations : false;
    }
}

/**
 * DTO for updating a Complementary Task
 */
export class UpdateComplementaryTaskDto {
    constructor(data) {
        if (data.categoryId !== undefined) this.categoryId = data.categoryId;
        if (data.description !== undefined) this.description = data.description;
        if (data.responsibleTeam !== undefined) this.responsibleTeam = data.responsibleTeam;
        if (data.startTime !== undefined) this.startTime = data.startTime;
        if (data.endTime !== undefined) this.endTime = data.endTime;
        if (data.status !== undefined) this.status = data.status;
        if (data.suspendsOperations !== undefined) this.suspendsOperations = data.suspendsOperations;
    }
}

/**
 * DTO for filtering/searching Complementary Tasks
 */
export class ComplementaryTaskFilterDto {
    constructor(data = {}) {
        this.taskId = data.taskId;
        this.categoryId = data.categoryId;
        this.vveId = data.vveId;
        this.status = data.status;
        this.suspendsOperations = data.suspendsOperations;
        this.responsibleTeam = data.responsibleTeam;
        this.startTimeFrom = data.startTimeFrom;
        this.startTimeTo = data.startTimeTo;
        this.endTimeFrom = data.endTimeFrom;
        this.endTimeTo = data.endTimeTo;
    }
}

/**
 * DTO for Complementary Task response
 */
export class ComplementaryTaskDto {
    constructor(data) {
        this.taskId = data.taskId;
        this.categoryId = data.categoryId;
        this.vveId = data.vveId;
        this.description = data.description;
        this.responsibleTeam = data.responsibleTeam;
        this.startTime = data.startTime;
        this.endTime = data.endTime;
        this.status = data.status;
        this.suspendsOperations = data.suspendsOperations;
        this.durationMinutes = data.durationMinutes || null;
        this.createdBy = data.createdBy;
        this.createdAt = data.createdAt;
        this.updatedBy = data.updatedBy;
        this.updatedAt = data.updatedAt;
    }
}

