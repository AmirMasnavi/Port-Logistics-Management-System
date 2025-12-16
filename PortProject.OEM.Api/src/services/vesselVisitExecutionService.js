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
   * Get VVEs with execution metrics
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array<Object>>} VVEs with calculated metrics
   */
  async getVvesWithMetrics(filters = {}) {
    const vves = await this.vveRepository.findAll(filters);
    
    console.log(`[VVE Service] Processing ${vves.length} VVEs for metrics calculation`);
    
    // Fetch VVN data for each VVE to calculate metrics
    const vvesWithMetrics = await Promise.all(
      vves.map(async (vve, index) => {
        try {
          console.log(`[VVE Service] [${index + 1}/${vves.length}] Processing VVE: ${vve.vveId}, vvnId: ${vve.vvnId}`);
          console.log(`[VVE Service] actualArrivalTime: ${vve.actualArrivalTime}`);
          
          // Get VVN data from Master Data API
          const vvn = await this.masterDataGateway.getVvnAsync(vve.vvnId);
          
          if (!vvn) {
            console.warn(`[VVE Service] ⚠️  VVN not found for VVE ${vve.vveId} (vvnId: ${vve.vvnId})`);
          } else {
            console.log(`[VVE Service] ✓ VVN found - estimatedArrival: ${vvn.estimatedArrival}, estimatedDeparture: ${vvn.estimatedDeparture}`);
          }
          
          // Calculate execution metrics
          const metrics = this.calculateExecutionMetrics(vve, vvn);
          
          if (metrics) {
            console.log(`[VVE Service] Metrics calculated - arrivalDelay: ${metrics.arrivalDelay}h, totalTurnaround: ${metrics.totalTurnaroundTime}h`);
          } else {
            console.log(`[VVE Service] No metrics calculated (VVN data missing)`);
          }
          
          return {
            ...VveMapper.toResponseDto(vve),
            metrics,
            vvnData: vvn ? {
              estimatedArrival: vvn.estimatedArrival,
              estimatedDeparture: vvn.estimatedDeparture,
              assignedDockName: vvn.assignedDockName,
            } : null
          };
        } catch (error) {
          console.error(`[VVE] ❌ Error fetching VVN data for ${vve.vvnId}:`, error.message);
          // Return VVE without VVN data if fetch fails
          return {
            ...VveMapper.toResponseDto(vve),
            metrics: null,
            vvnData: null
          };
        }
      })
    );
    
    console.log(`[VVE Service] ✓ Returning ${vvesWithMetrics.length} VVEs with metrics`);
    
    return vvesWithMetrics;
  }

  /**
   * Calculate execution metrics for a VVE
   * @param {Object} vve - VVE data
   * @param {Object} vvn - VVN data from Master Data
   * @returns {Object} Calculated metrics
   */
  calculateExecutionMetrics(vve, vvn) {
    if (!vvn) {
      console.log(`[Metrics] Cannot calculate metrics - VVN data is null`);
      return null;
    }

    const actualArrival = new Date(vve.actualArrivalTime);
    const estimatedArrival = new Date(vvn.estimatedArrival);
    const estimatedDeparture = new Date(vvn.estimatedDeparture);
    
    console.log(`[Metrics] Calculating for VVE ${vve.vveId}:`);
    console.log(`[Metrics]   Actual Arrival:     ${actualArrival.toISOString()} (${vve.actualArrivalTime})`);
    console.log(`[Metrics]   Estimated Arrival:  ${estimatedArrival.toISOString()} (${vvn.estimatedArrival})`);
    console.log(`[Metrics]   Estimated Departure: ${estimatedDeparture.toISOString()} (${vvn.estimatedDeparture})`);
    
    const arrivalDelayMs = actualArrival - estimatedArrival;
    const arrivalDelayHours = arrivalDelayMs / (1000 * 60 * 60);
    
    console.log(`[Metrics]   Delay in milliseconds: ${arrivalDelayMs}ms`);
    console.log(`[Metrics]   Delay in hours: ${arrivalDelayHours}h (${arrivalDelayHours > 0 ? 'LATE' : arrivalDelayHours < 0 ? 'EARLY' : 'ON TIME'})`);
    
    const metrics = {
      // Delay in arrival (in hours) - positive means late, negative means early
      arrivalDelay: arrivalDelayHours,
      
      // Waiting time for berthing (time between arrival and estimated berthing)
      // For now, using estimated arrival as berthing time approximation
      waitingTimeForBerthing: 0, // Can be enhanced if berthing time is tracked separately
    };

    // If VVE is completed, calculate additional metrics
    if (vve.actualDepartureTime) {
      const actualDeparture = new Date(vve.actualDepartureTime);
      
      // Total turnaround time (actual departure - actual arrival) in hours
      metrics.totalTurnaroundTime = (actualDeparture - actualArrival) / (1000 * 60 * 60);
      
      // Berth occupancy time (same as turnaround time for now)
      metrics.berthOccupancyTime = metrics.totalTurnaroundTime;
      
      // Departure delay (in hours)
      metrics.departureDelay = (actualDeparture - estimatedDeparture) / (1000 * 60 * 60);
      
      // Estimated turnaround time
      metrics.estimatedTurnaroundTime = (estimatedDeparture - estimatedArrival) / (1000 * 60 * 60);
      
      // Operation delay (difference between actual and estimated turnaround)
      metrics.operationDelay = metrics.totalTurnaroundTime - metrics.estimatedTurnaroundTime;
    } else {
      // VVE is still in progress
      metrics.totalTurnaroundTime = null;
      metrics.berthOccupancyTime = null;
      metrics.departureDelay = null;
      metrics.estimatedTurnaroundTime = (estimatedDeparture - estimatedArrival) / (1000 * 60 * 60);
      metrics.operationDelay = null;
    }

    // Round all values to 2 decimal places
    Object.keys(metrics).forEach(key => {
      if (metrics[key] !== null && typeof metrics[key] === 'number') {
        metrics[key] = Math.round(metrics[key] * 100) / 100;
      }
    });

    return metrics;
  }

  /**
   * Update VVE
   * @param {string} vveId - VVE identifier
   * @param {UpdateVveDto} dto - Update DTO
   * @param {string} performedBy - User performing the update (for audit)
   * @returns {Promise<VveResponseDto>}
   */
  async updateVve(vveId, dto, performedBy = 'system') {
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

    const changeDetails = {};

      if (dto.status !== undefined) {
      updateData.status = dto.status;
      changeDetails.status = dto.status;

      // Auto-set departure time if completing
      if (dto.status === 'Completed' && !dto.actualDepartureTime && !existingVve.actualDepartureTime) {
        updateData.actualDepartureTime = new Date();
        changeDetails.actualDepartureTime = updateData.actualDepartureTime;
      }
    }
    
    if (dto.actualDepartureTime !== undefined) {
      updateData.actualDepartureTime = new Date(dto.actualDepartureTime);
      changeDetails.actualDepartureTime = updateData.actualDepartureTime;
    }

    if (dto.berthDockId !== undefined) {
      updateData.berthDockId = dto.berthDockId;
      changeDetails.berthDockId = dto.berthDockId;
    }
    
    if (dto.notes !== undefined) {
      // preserve and append (if existing) instead of overriding
        const existingNotes = existingVve.notes || '';
        updateData.notes = dto.notes;
        changeDetails.notes = dto.notes;
    }

      // 3.a Compare dock against planned (if we have berthDockId or actualBerthTime changes)
      let autoNote = null;
      try {
          if ((dto.berthDockId !== undefined || dto.actualBerthTime !== undefined) && this.masterDataGateway) {
              const vvn = await this.masterDataGateway.getVvnAsync(existingVve.vvnId);
              if (vvn) {
                  const plannedDock = vvn.assignedDockId || vvn.assignedDockName || null;
                  const actualDock = dto.berthDockId || existingVve.berthDockId || null;
                  // If we can compare and they differ, add an automatic warning/note
                  if (plannedDock && actualDock && plannedDock !== actualDock) {
                      autoNote = `[AUTO] Discrepância de cais: planejado='${plannedDock}', efetivo='${actualDock}' (registrado por ${performedBy} em ${new Date().toISOString()})`;
                      // append autoNote to notes (preserve existing/new notes)
                      const prevNotes = updateData.notes !== undefined ? updateData.notes : existingVve.notes || '';
                      updateData.notes = `${prevNotes}${prevNotes ? '\n' : ''}${autoNote}`;
                      changeDetails.autoNote = autoNote;
                  }
              }
          }
      } catch (err) {
          // não falhar a atualização por erro no master data lookup — apenas logar
          console.warn(`[VVE UPDATE] Could not fetch VVN for dock comparison: ${err.message}`);
      }
      // 4. Audit logging: append audit entry
      try {
          const auditEntry = {
              userId: performedBy || 'unknown',
              action: 'update',
              timestamp: new Date(),
              details: {
                  vveId,
                  ...changeDetails
              }
          };
          // Merge with existing audit logs (push new entry)
          const existingLogs = existingVve.auditLogs || [];
          updateData.auditLogs = [...existingLogs, auditEntry];
      } catch (err) {
          console.warn('[VVE UPDATE] Failed to append audit log:', err.message);
      }
      
    // 5. Update in repository
    const updatedVve = await this.vveRepository.update(vveId, updateData);

    // 6. Map to response DTO
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
