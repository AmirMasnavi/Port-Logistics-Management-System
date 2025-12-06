import { CreateVveDto, UpdateVveDto } from '../application/dtos/VveDto.js';
import { VveMapper } from '../application/mappers/VveMapper.js';
import { VveRepository } from '../infrastructure/repositories/VveRepository.js';

/**
 * Service for Vessel Visit Execution operations
 * Application Layer - Contains business logic
 */
export class VesselVisitExecutionService {
  constructor(masterDataGateway) {
    this.masterDataGateway = masterDataGateway;
    this.vveRepository = new VveRepository();
  }

  /**
   * Create a new Vessel Visit Execution
   * @param {CreateVveDto} dto - VVE creation DTO
   * @param {string} creatorUserId - User creating the VVE
   * @returns {Promise<VveResponseDto>} Created VVE
   */
  async createVve(dto, creatorUserId) {
    // 1. Validate DTO
    const validation = dto.validate();
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // 2. Check if VVN exists in Master Data
    const vvn = await this.masterDataGateway.getVvnAsync(dto.vvnId);
    if (!vvn) {
      throw new Error(`VVN '${dto.vvnId}' not found in Master Data system`);
    }

    // 3. Check if VVE already exists for this VVN
    const existingVve = await this.vveRepository.existsByVvnId(dto.vvnId);
    if (existingVve) {
      throw new Error(`A VVE already exists for VVN '${dto.vvnId}'`);
    }

    // 4. Generate unique VVE ID
    const vveId = await this.vveRepository.generateNextId();

    // 5. Create VVE data
    const vveData = {
      vveId,
      vvnId: dto.vvnId,
      vesselIdentifier: dto.vesselIdentifier,
      actualArrivalTime: new Date(dto.actualArrivalTime),
      creatorUserId,
      status: 'In Progress',
      notes: dto.notes || '',
    };

    // 6. Save to repository
    const savedVve = await this.vveRepository.create(vveData);

    // 7. Map to response DTO
    return VveMapper.toResponseDto(savedVve);
  }

  /**
   * Get VVE by ID
   * @param {string} vveId - VVE identifier
   * @returns {Promise<VveResponseDto|null>}
   */
  async getVveById(vveId) {
    const vve = await this.vveRepository.findById(vveId);
    return vve ? VveMapper.toResponseDto(vve) : null;
  }

  /**
   * Get all VVEs with optional filtering
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array<VveListItemDto>>}
   */
  async getAllVves(filters = {}) {
    const vves = await this.vveRepository.findAll(filters);
    return VveMapper.toListDto(vves);
  }

  /**
   * Update VVE
   * @param {string} vveId - VVE identifier
   * @param {UpdateVveDto} dto - Update DTO
   * @returns {Promise<VveResponseDto>}
   */
  async updateVve(vveId, dto) {
    // 1. Validate DTO
    const validation = dto.validate();
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // 2. Check if VVE exists
    const existingVve = await this.vveRepository.findById(vveId);
    if (!existingVve) {
      throw new Error(`VVE '${vveId}' not found`);
    }

    // 3. Prepare update data
    const updateData = {};
    
    if (dto.status !== undefined) {
      updateData.status = dto.status;
      
      // Auto-set departure time if completing
      if (dto.status === 'Completed' && !dto.actualDepartureTime && !existingVve.actualDepartureTime) {
        updateData.actualDepartureTime = new Date();
      }
    }
    
    if (dto.actualDepartureTime !== undefined) {
      updateData.actualDepartureTime = new Date(dto.actualDepartureTime);
    }
    
    if (dto.notes !== undefined) {
      updateData.notes = dto.notes;
    }

    // 4. Update in repository
    const updatedVve = await this.vveRepository.update(vveId, updateData);

    // 5. Map to response DTO
    return VveMapper.toResponseDto(updatedVve);
  }

  /**
   * Delete VVE
   * @param {string} vveId - VVE identifier
   * @returns {Promise<boolean>} Success status
   */
  async deleteVve(vveId) {
    return await this.vveRepository.delete(vveId);
  }

  /**
   * Get VVE statistics
   * @returns {Promise<VveStatisticsDto>} Statistics
   */
  async getVveStatistics() {
    const total = await this.vveRepository.countAll();
    const inProgress = await this.vveRepository.countByStatus('In Progress');
    const completed = await this.vveRepository.countByStatus('Completed');
    const cancelled = await this.vveRepository.countByStatus('Cancelled');

    return {
      total,
      inProgress,
      completed,
      cancelled,
    };
  }
}
