import { VveResponseDto, VveListItemDto } from '../dtos/VveDto.js';
import { OperationComparisonDto } from '../dtos/ExecutedOperationDto.js';

/**
 * Mapper for VVE conversions between layers
 * Follows the Onion Architecture principle of separation of concerns
 */
export class VveMapper {
  /**
   * Convert persistence model to response DTO
   * @param {Object} model - Mongoose model instance or plain object
   * @returns {VveResponseDto} Response DTO
   */
  static toResponseDto(model) {
    return new VveResponseDto({
      vveId: model.vveId,
      vvnId: model.vvnId,
      vesselIdentifier: model.vesselIdentifier,
      actualArrivalTime: model.actualArrivalTime,
      actualBerthTime: model.actualBerthTime,
      berthDockId: model.berthDockId,
      creatorEmail: model.creatorEmail,
      status: model.status,
      actualDepartureTime: model.actualDepartureTime,
      actualUnberthTime: model.actualUnberthTime,
      actualPortDepartureTime: model.actualPortDepartureTime,
      completedBy: model.completedBy,
      completedAt: model.completedAt,
      notes: model.notes,
      auditLogs: model.auditLogs || [],
      executedOperations: model.executedOperations || [],
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }
  /**
   * Convert persistence model to list item DTO
   * @param {Object} model - Mongoose model instance or plain object
   * @returns {VveListItemDto} List item DTO
   */
  static toListItemDto(model) {
    return new VveListItemDto({
      vveId: model.vveId,
      vvnId: model.vvnId,
      vesselIdentifier: model.vesselIdentifier,
      status: model.status,
      actualArrivalTime: model.actualArrivalTime,
      createdAt: model.createdAt,
      creatorEmail: model.creatorEmail,
    });
  }

  /**
   * Convert array of models to list of DTOs
   * @param {Array<Object>} models - Array of mongoose models
   * @returns {Array<VveListItemDto>} Array of list item DTOs
   */
  static toListDto(models) {
    return models.map(model => this.toListItemDto(model));
  }

  /**
   * Merge planned operation with executed data and compute status
   * @param {Object} plannedOp - Planned operation from Operation Plan
   * @param {Object} executedOp - Executed operation from VVE (may be null)
   * @returns {OperationComparisonDto} Merged operation data with computed status
   */
  static toOperationComparisonDto(plannedOp, executedOp) {
    const now = new Date();
    const plannedStart = plannedOp.startTime ? new Date(plannedOp.startTime) : null;
    
    // Determine current status
    let computedStatus = executedOp ? executedOp.status : 'PENDING';
    let delayMinutes = null;
    
    // Calculate DELAYED status dynamically (not persisted)
    if (computedStatus === 'PENDING' && plannedStart && now > plannedStart) {
      computedStatus = 'DELAYED';
      delayMinutes = Math.round((now - plannedStart) / (1000 * 60));
    }
    
    // Calculate delay for started/completed operations
    if (executedOp && executedOp.startTime && plannedStart) {
      const actualStart = new Date(executedOp.startTime);
      delayMinutes = Math.round((actualStart - plannedStart) / (1000 * 60));
    }
    
    return new OperationComparisonDto({
      operationId: plannedOp.operationId || plannedOp._id,
      // Operation details
      name: executedOp?.name || plannedOp.name || '',
      type: executedOp?.type || plannedOp.type || 'Other',
      // Planned data
      plannedStartTime: plannedOp.startTime,
      plannedEndTime: plannedOp.endTime,
      plannedResource: plannedOp.resourceId,
      plannedStaff: plannedOp.staffId || plannedOp.staffShortName,
      vesselVisitId: plannedOp.vesselVisitId,
      vesselImo: plannedOp.vesselImo,
      dockName: plannedOp.dockName,
      // Executed data
      executedStatus: executedOp ? executedOp.status : null,
      actualStartTime: executedOp ? executedOp.startTime : null,
      actualEndTime: executedOp ? executedOp.endTime : null,
      startedBy: executedOp ? executedOp.startedBy : null,
      completedBy: executedOp ? executedOp.completedBy : null,
      actualResource: executedOp ? executedOp.actualResource : null,
      // Computed fields
      computedStatus,
      delayMinutes,
      notes: executedOp ? executedOp.notes : '',
    });
  }
}
