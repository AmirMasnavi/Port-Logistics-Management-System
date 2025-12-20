import { CreateVveDto, UpdateVveDto } from '../application/dtos/VveDto.js';
import { UpdateOperationStatusDto } from '../application/dtos/ExecutedOperationDto.js';
import { VveMapper } from '../application/mappers/VveMapper.js';
import { VveRepository } from '../infrastructure/repositories/VveRepository.js';
import { OperationPlanRepository } from '../infrastructure/repositories/OperationPlanRepository.js';
import { generateSmartOperations, mergeOperationsWithExecutionData } from '../application/utils/SmartOperationGenerator.js';

/**
 * Service for Vessel Visit Execution operations
 * Application Layer - Contains business logic
 */
export class VesselVisitExecutionService {
  constructor(masterDataGateway) {
    this.masterDataGateway = masterDataGateway;
    this.vveRepository = new VveRepository();
    this.operationPlanRepository = new OperationPlanRepository();
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

    console.log(`[VVE CREATE] DTO received:`, {
      vvnId: dto.vvnId,
      vesselIdentifier: dto.vesselIdentifier,
      generateInitialOperations: dto.generateInitialOperations,
      actualArrivalTime: dto.actualArrivalTime
    });

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
      executedOperations: [], // Initialize empty
    };

    // 6. Optionally generate initial operations from the plan
    console.log(`[VVE CREATE] generateInitialOperations flag: ${dto.generateInitialOperations}`);
    
    if (dto.generateInitialOperations) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`[VVE Service] 🚀 SMART OPERATION GENERATION - START`);
      console.log(`${'='.repeat(80)}`);
      console.log(`[VVE Service] VVE ID: ${vveId}`);
      console.log(`[VVE Service] VVN ID to match: "${dto.vvnId}"`);
      console.log(`[VVE Service] Vessel IMO: ${dto.vesselIdentifier}`);
      
      try {
        // Extract the date from actualArrivalTime
        const arrivalDate = new Date(dto.actualArrivalTime);
        const dateStr = arrivalDate.toISOString().split('T')[0]; // YYYY-MM-DD
        console.log(`[VVE Service] Arrival date: ${dateStr}`);
        console.log(`${'─'.repeat(80)}`);

        // Find operation plan for this date and vessel
        console.log(`[VVE Service] 🔍 Searching for operation plans...`);
        console.log(`[VVE Service] Search criteria: date="${dateStr}", vesselVisitId="${dto.vvnId}"`);
        
        const plans = await this.operationPlanRepository.findAll({
          date: dateStr,
          vesselVisitId: dto.vvnId 
        });

        console.log(`[VVE Service] 📋 Found ${plans.length} plan(s) for date ${dateStr}`);

        if (plans.length > 0) {
          const plan = plans[0];
          console.log(`[VVE Service] ✓ Using plan: ${plan.planId}`);
          console.log(`[VVE Service] ✓ Total tasks in plan: ${plan.scheduledTasks?.length || 0}`);
          console.log(`${'─'.repeat(80)}`);
          
          // Show all tasks and matching logic
          console.log(`[VVE Service] 🔍 VESSEL MATCHING:`);
          console.log(`[VVE Service] Looking for VVN: "${dto.vvnId}"\n`);
          
          plan.scheduledTasks.forEach((task, idx) => {
            const matchVesselVisitId = task.vesselVisitId === dto.vvnId;
            const matchBusinessId = task.vesselVisitBusinessId === dto.vvnId;
            const matches = matchVesselVisitId || matchBusinessId;
            
            console.log(`[VVE Service] Task #${idx + 1}:`);
            console.log(`[VVE Service]   vesselVisitId: "${task.vesselVisitId}" ${matchVesselVisitId ? '✅ MATCH!' : '❌'}`);
            console.log(`[VVE Service]   vesselVisitBusinessId: "${task.vesselVisitBusinessId}" ${matchBusinessId ? '✅ MATCH!' : '❌'}`);
            console.log(`[VVE Service]   vesselImo: "${task.vesselImo}"`);
            console.log(`[VVE Service]   → Result: ${matches ? '✅ WILL USE THIS TASK' : '⏭️  Skip'}\n`);
          });
          
          // Filter tasks for this vessel visit
          const vesselTasks = plan.scheduledTasks.filter(
            task => task.vesselVisitId === dto.vvnId || task.vesselVisitBusinessId === dto.vvnId
          );

          console.log(`${'─'.repeat(80)}`);
          console.log(`[VVE Service] 🎯 RESULT: ${vesselTasks.length} matching task(s) found`);

          if (vesselTasks.length === 0) {
            console.log(`[VVE Service] ❌ NO MATCHING TASKS!`);
            console.log(`[VVE Service] The VVN "${dto.vvnId}" is not in this plan.`);
            console.log(`[VVE Service] Available VVNs in this plan:`);
            const availableVvns = [...new Set(plan.scheduledTasks.map(t => 
              t.vesselVisitBusinessId || t.vesselVisitId
            ))].filter(Boolean);
            availableVvns.forEach(vvn => console.log(`[VVE Service]   • ${vvn}`));
            console.log(`[VVE Service] 💡 Create a VVE for one of the above VVNs to generate operations.`);
          } else {
            console.log(`[VVE Service] ✅ Matched ${vesselTasks.length} task(s). Generating operations...\n`);
            
            // Generate operations for each task and add them as PENDING
            vesselTasks.forEach((task, taskIdx) => {
              console.log(`[VVE Service] 🔧 Task ${taskIdx + 1}/${vesselTasks.length}: Generating smart operations...`);
              const virtualOps = generateSmartOperations(task);
              console.log(`[VVE Service] ⚙️  Generated ${virtualOps.length} operations`);
              
              // Convert virtual operations to executed operations with PENDING status
              virtualOps.forEach((op, opIdx) => {
                vveData.executedOperations.push({
                  operationId: op.operationId,
                  name: op.name,
                  type: op.type,
                  status: 'PENDING',
                  startTime: null,
                  endTime: null,
                  startedBy: null,
                  completedBy: null,
                  actualResource: op.resourceId,
                  notes: `Auto-generated: ${op.name}`,
                });
                
                if (opIdx === 0) {
                  console.log(`[VVE Service]    Sample: ${op.name} (${op.type})`);
                }
              });
            });

            console.log(`\n[VVE Service] ✅ SUCCESS! Generated ${vveData.executedOperations.length} total operations`);
          }
        } else {
          console.log(`[VVE Service] ❌ No operation plan found for date ${dateStr}`);
          console.log(`[VVE Service] Cannot generate smart operations without a plan.`);
        }
      } catch (error) {
        console.error(`[VVE Service] ❌ ERROR during auto-generation:`, error.message);
        console.error(error.stack);
        // Don't fail the VVE creation if operation generation fails
      }
      console.log(`${'='.repeat(80)}`);
      console.log(`[VVE Service] 🚀 SMART OPERATION GENERATION - END\n`);
    } else {
      console.log(`[VVE Service] ⏭️  Auto-generation disabled (checkbox not checked)`);
    }

    // 7. Save to repository
    const savedVve = await this.vveRepository.create(vveData);

    // 8. Map to response DTO
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

  /**
   * Update operation status (US 4.1.9)
   * @param {string} vveId - VVE identifier
   * @param {UpdateOperationStatusDto} dto - Operation status update DTO
   * @param {string} operatorId - Operator performing the update
   * @returns {Promise<VveResponseDto>} Updated VVE
   */
  async updateOperationStatus(vveId, dto, operatorId) {
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

    // 3. Prepare status data
    const statusData = {
      status: dto.status,
      timestamp: dto.timestamp,
      operatorId: operatorId, // Use the authenticated user's ID
      resourceId: dto.resourceId,
      notes: dto.notes,
      name: dto.name,
      type: dto.type
    };

    console.log(`[VVE Service] Updating operation ${dto.operationId} in VVE ${vveId} to status ${dto.status} by ${operatorId}`);

    // 4. Update in repository
    const updatedVve = await this.vveRepository.updateOperationStatus(vveId, dto.operationId, statusData);

    // 5. Return mapped DTO
    return VveMapper.toResponseDto(updatedVve);
  }

  /**
   * Get VVE with operation plan comparison (US 4.1.9)
   * Uses Smart Operation Generator to create detailed operations from planned tasks
   * @param {string} vveId - VVE identifier
   * @returns {Promise<Object>} VVE with merged operation data
   */
  async getVveWithPlanComparison(vveId) {
    // 1. Get VVE execution data
    const vve = await this.vveRepository.findById(vveId);
    if (!vve) {
      throw new Error(`VVE '${vveId}' not found`);
    }

    console.log(`[VVE Service] Fetching plan comparison for VVE ${vveId} (VVN: ${vve.vvnId})`);

    // 2. Get the operation plan for this vessel visit
    // Extract the date from VVE's actualArrivalTime
    const arrivalDate = new Date(vve.actualArrivalTime);
    const dateStr = arrivalDate.toISOString().split('T')[0]; // YYYY-MM-DD

    // Find plans for this date and vessel
    const plans = await this.operationPlanRepository.findAll({
      date: dateStr,
      vesselVisitId: vve.vvnId 
    });

    console.log(`[VVE Service] Found ${plans.length} operation plans for date ${dateStr} and vessel ${vve.vvnId}`);

    let detailedOperations = [];
    
    if (plans.length > 0) {
      // Use the first (most recent) plan
      const plan = plans[0];
      
      // 3. Filter tasks for this vessel visit
      const vesselTasks = plan.scheduledTasks.filter(
        task => task.vesselVisitId === vve.vvnId || task.vesselVisitBusinessId === vve.vvnId
      );

      console.log(`[VVE Service] Found ${vesselTasks.length} scheduled tasks for this vessel in plan ${plan.planId}`);

      // 4. Generate detailed operations using Smart Operation Generator
      const matchedOperationIds = new Set();

      vesselTasks.forEach(task => {
        // A. Generate virtual operations from the planned task
        const virtualOps = generateSmartOperations(task);
        
        console.log(`[VVE Service] Generated ${virtualOps.length} operations for task ${task._id}`);

        // B. Merge with saved execution data from VVE
        const mergedOps = mergeOperationsWithExecutionData(
          virtualOps,
          vve.executedOperations || []
        );
        
        // Track which executed operations were matched
        mergedOps.forEach(op => {
            if (vve.executedOperations.some(eo => eo.operationId === op.operationId)) {
                matchedOperationIds.add(op.operationId);
            }
        });

        detailedOperations = detailedOperations.concat(mergedOps);
      });

      // C. Add any manual operations that weren't part of the plan
      const manualOperations = (vve.executedOperations || [])
        .filter(eo => !matchedOperationIds.has(eo.operationId))
        .map(eo => ({
            operationId: eo.operationId,
            name: eo.name || 'Manual Operation',
            type: eo.type || 'Other',
            
            executedStatus: eo.status,
            computedStatus: eo.status,
            
            actualStartTime: eo.startTime,
            actualEndTime: eo.endTime,
            startedBy: eo.startedBy,
            completedBy: eo.completedBy,
            actualResource: eo.actualResource,
            notes: eo.notes,
            
            // No planned data for manual operations
            plannedStartTime: null,
            plannedEndTime: null,
            plannedResource: null,
        }));
        
      if (manualOperations.length > 0) {
          console.log(`[VVE Service] Found ${manualOperations.length} manual operations not in plan`);
          detailedOperations = detailedOperations.concat(manualOperations);
      }

      // 5. Sort chronologically
      detailedOperations.sort((a, b) => {
          const timeA = a.plannedStartTime ? new Date(a.plannedStartTime) : (a.actualStartTime ? new Date(a.actualStartTime) : new Date(0));
          const timeB = b.plannedStartTime ? new Date(b.plannedStartTime) : (b.actualStartTime ? new Date(b.actualStartTime) : new Date(0));
          return timeA - timeB;
      });

      console.log(`[VVE Service] Total detailed operations: ${detailedOperations.length}`);
    } else {
      console.log(`[VVE Service] No operation plan found - returning executed operations only`);
      
      // If no plan exists, just return executed operations (if any)
      detailedOperations = (vve.executedOperations || []).map(eo => ({
        operationId: eo.operationId,
        status: eo.status,
        actualStartTime: eo.startTime,
        actualEndTime: eo.endTime,
        startedBy: eo.startedBy,
        completedBy: eo.completedBy,
        actualResource: eo.actualResource,
        notes: eo.notes,
        // No planned data available
        plannedStartTime: null,
        plannedEndTime: null,
        plannedResource: null,
      }));
    }

    // 6. Return VVE with generated + merged operations
    return {
      ...VveMapper.toResponseDto(vve),
      operations: detailedOperations,
      planExists: plans.length > 0,
      planId: plans.length > 0 ? plans[0].planId : null,
    };
  }
}
