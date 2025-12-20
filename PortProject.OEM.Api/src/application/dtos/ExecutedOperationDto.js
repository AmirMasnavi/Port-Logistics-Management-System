/**
 * DTO for updating operation status
 * US 4.1.9 - Update VVE with executed operations
 */
export class UpdateOperationStatusDto {
  constructor(data) {
    this.operationId = data.operationId;
    this.status = data.status; // 'STARTED', 'COMPLETED', 'SUSPENDED'
    this.timestamp = data.timestamp ? new Date(data.timestamp) : new Date();
    this.operatorId = data.operatorId; // The user ID (NOT email for GDPR)
    this.resourceId = data.resourceId; // Optional: if they changed resource
    this.name = data.name || ''; // Operation name
    this.type = data.type || 'Other'; // Operation type (Loading, Unloading, etc.)
    this.notes = data.notes || '';
  }

  validate() {
    const errors = [];

    if (!this.operationId || this.operationId.trim() === '') {
      errors.push('Operation ID is required');
    }

    const validStatuses = ['PENDING', 'STARTED', 'COMPLETED', 'SUSPENDED'];
    if (!this.status || !validStatuses.includes(this.status)) {
      errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
    }

    if (!this.operatorId || this.operatorId.trim() === '') {
      errors.push('Operator ID is required');
    }

    if (this.timestamp && isNaN(this.timestamp.getTime())) {
      errors.push('Invalid timestamp format');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * DTO for executed operation response
 */
export class ExecutedOperationResponseDto {
  constructor({
    operationId,
    status,
    startTime,
    startedBy,
    endTime,
    completedBy,
    actualResource,
    notes,
  }) {
    this.operationId = operationId;
    this.status = status;
    this.startTime = startTime;
    this.startedBy = startedBy;
    this.endTime = endTime;
    this.completedBy = completedBy;
    this.actualResource = actualResource;
    this.notes = notes;
  }
}

/**
 * DTO for operation comparison (planned vs executed)
 */
export class OperationComparisonDto {
  constructor({
    operationId,
    // Operation details
    name,
    type,
    // Planned data
    plannedStartTime,
    plannedEndTime,
    plannedResource,
    plannedStaff,
    vesselVisitId,
    vesselImo,
    dockName,
    // Executed data
    executedStatus,
    actualStartTime,
    actualEndTime,
    startedBy,
    completedBy,
    actualResource,
    // Computed status
    computedStatus,
    delayMinutes,
    notes,
  }) {
    // Operation details
    this.name = name || '';
    this.type = type || 'Other';
    
    // Planned information
    this.operationId = operationId;
    this.plannedStartTime = plannedStartTime;
    this.plannedEndTime = plannedEndTime;
    this.plannedResource = plannedResource;
    this.plannedStaff = plannedStaff;
    this.vesselVisitId = vesselVisitId;
    this.vesselImo = vesselImo;
    this.dockName = dockName;

    // Execution information
    this.executedStatus = executedStatus;
    this.actualStartTime = actualStartTime;
    this.actualEndTime = actualEndTime;
    this.startedBy = startedBy;
    this.completedBy = completedBy;
    this.actualResource = actualResource;

    // Computed fields
    this.computedStatus = computedStatus;
    this.delayMinutes = delayMinutes;
    this.notes = notes;
  }
}

