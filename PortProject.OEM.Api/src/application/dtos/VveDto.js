/**
 * DTO for creating a new VVE
 */
export class CreateVveDto {
  constructor({ vvnId, vesselIdentifier, actualArrivalTime, notes = '' }) {
    this.vvnId = vvnId;
    this.vesselIdentifier = vesselIdentifier;
    this.actualArrivalTime = actualArrivalTime;
    this.notes = notes;
  }

  validate() {
    const errors = [];

    if (!this.vvnId || this.vvnId.trim() === '') {
      errors.push('VVN ID is required');
    }

    if (!this.vesselIdentifier || this.vesselIdentifier.trim() === '') {
      errors.push('Vessel identifier is required');
    }

    if (!this.actualArrivalTime) {
      errors.push('Actual arrival time is required');
    } else {
      const date = new Date(this.actualArrivalTime);
      if (isNaN(date.getTime())) {
        errors.push('Invalid arrival time format');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * DTO for updating a VVE
 */
export class UpdateVveDto {
  constructor({ status, actualDepartureTime, notes, actualBerthTime, berthDockId }) {
    this.status = status;
    this.actualDepartureTime = actualDepartureTime;
    this.actualBerthTime = actualBerthTime;
    this.berthDockId = berthDockId;
    this.notes = notes;
  }

  validate() {
    const errors = [];
    const validStatuses = ['In Progress', 'Completed', 'Cancelled'];

    if (this.status && !validStatuses.includes(this.status)) {
      errors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    if (this.actualDepartureTime) {
      const date = new Date(this.actualDepartureTime);
      if (isNaN(date.getTime())) {
        errors.push('Invalid departure time format');
      }
    }
      if (this.actualBerthTime) {
          const berthDate = new Date(this.actualBerthTime);
          if (isNaN(berthDate.getTime())) {
              errors.push('Invalid berth time format');
          }
      }

      if (this.berthDockId && typeof this.berthDockId !== 'string') {
          errors.push('Berth dock ID must be a string');
      }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * DTO for VVE response
 */
export class VveResponseDto {
  constructor({
    vveId,
    vvnId,
    vesselIdentifier,
    actualArrivalTime,
    actualBerthTime,
    berthDockId,
    creatorUserId,
    status,
    actualDepartureTime,
    notes,
    createdAt,
    updatedAt,
    auditLogs = [],
  }) {
    this.vveId = vveId;
    this.vvnId = vvnId;
    this.vesselIdentifier = vesselIdentifier;
    this.actualArrivalTime = actualArrivalTime;
    this.actualBerthTime = actualBerthTime;
    this.berthDockId = berthDockId;
    this.creatorUserId = creatorUserId;
    this.status = status;
    this.actualDepartureTime = actualDepartureTime;
    this.notes = notes;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.auditLogs = auditLogs;

  }
}

/**
 * DTO for VVE list item (simplified)
 */
export class VveListItemDto {
  constructor({ vveId, vvnId, vesselIdentifier, status, actualArrivalTime, createdAt }) {
    this.vveId = vveId;
    this.vvnId = vvnId;
    this.vesselIdentifier = vesselIdentifier;
    this.status = status;
    this.actualArrivalTime = actualArrivalTime;
    this.createdAt = createdAt;
  }
}

/**
 * DTO for VVE statistics
 */
export class VveStatisticsDto {
  constructor({ total, inProgress, completed, cancelled }) {
    this.total = total;
    this.inProgress = inProgress;
    this.completed = completed;
    this.cancelled = cancelled;
  }
}

