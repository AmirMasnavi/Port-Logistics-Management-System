import { VveResponseDto, VveListItemDto } from '../dtos/VveDto.js';

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
      creatorUserId: model.creatorUserId,
      status: model.status,
      actualDepartureTime: model.actualDepartureTime,
      actualBerthTime: model.actualBerthTime,
      berthDockId: model.berthDockId,
      notes: model.notes,
      auditLogs: model.auditLogs || [],
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
}
