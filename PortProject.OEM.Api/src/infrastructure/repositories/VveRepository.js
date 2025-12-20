import { IVveRepository } from '../../domain/repositories/IVveRepository.js';
import { VesselVisitExecutionModel } from '../models/VesselVisitExecutionModel.js';

/**
 * MongoDB implementation of VVE Repository
 * Infrastructure layer - implements the repository interface
 */
export class VveRepository extends IVveRepository {
  constructor() {
    super();
    this.model = VesselVisitExecutionModel;
  }

  /**
   * Create a new VVE
   * @param {Object} data - VVE data
   * @returns {Promise<Object>} Created VVE document
   */
  async create(data) {
    const document = new this.model(data);
    return await document.save();
  }

  /**
   * Find VVE by ID
   * @param {string} vveId - VVE identifier
   * @returns {Promise<Object|null>}
   */
  async findById(vveId) {
    return await this.model.findOne({ vveId }).lean();
  }

  /**
   * Find VVE by VVN ID
   * @param {string} vvnId - VVN identifier
   * @returns {Promise<Object|null>}
   */
  async findByVvnId(vvnId) {
    return await this.model.findOne({ vvnId }).lean();
  }

  /**
   * Find all VVEs with optional filters
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array<Object>>}
   */
  async findAll(filters = {}) {
    // First, get ALL VVEs to see what's in the database
    const allVves = await this.model.find({}).sort({ actualArrivalTime: -1 }).lean();
    console.log(`[VVE Repository] Total VVEs in database: ${allVves.length}`);
    console.log(`[VVE Repository] All VVE dates:`, allVves.map(v => ({
      vveId: v.vveId,
      actualArrivalTime: v.actualArrivalTime,
      vvnId: v.vvnId
    })));
    
    const query = {};
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.vvnId) {
      query.vvnId = filters.vvnId;
    }
    
    if (filters.vesselIdentifier) {
      // Support partial matching for vessel identifier
      query.vesselIdentifier = { $regex: filters.vesselIdentifier, $options: 'i' };
    }
    
    // Date range filtering
    if (filters.fromDate || filters.toDate) {
      query.actualArrivalTime = {};
      
      if (filters.fromDate) {
        // Parse date and set to start of day in UTC
        const fromDateObj = new Date(filters.fromDate + 'T00:00:00.000Z');
        console.log(`[VVE Repository] fromDate filter: ${filters.fromDate} -> ${fromDateObj.toISOString()}`);
        query.actualArrivalTime.$gte = fromDateObj;
      }
      
      if (filters.toDate) {
        // Parse date and set to end of day in UTC
        const toDateObj = new Date(filters.toDate + 'T23:59:59.999Z');
        console.log(`[VVE Repository] toDate filter: ${filters.toDate} -> ${toDateObj.toISOString()}`);
        query.actualArrivalTime.$lte = toDateObj;
      }
    }

    console.log(`[VVE Repository] MongoDB query:`, JSON.stringify(query, null, 2));

    const results = await this.model.find(query).sort({ actualArrivalTime: -1 }).lean();
    console.log(`[VVE Repository] Found ${results.length} VVEs after filtering`);
    
    if (results.length > 0) {
      console.log(`[VVE Repository] Filtered result dates:`, results.map(r => ({
        vveId: r.vveId,
        actualArrivalTime: r.actualArrivalTime
      })));
    }
    
    // Show which VVE was excluded if we went from 4 to 3
    if (allVves.length === 4 && results.length === 3) {
      const resultIds = new Set(results.map(r => r.vveId));
      const excluded = allVves.find(v => !resultIds.has(v.vveId));
      if (excluded) {
        console.log(`[VVE Repository] ⚠️  EXCLUDED VVE:`, {
          vveId: excluded.vveId,
          actualArrivalTime: excluded.actualArrivalTime,
          vvnId: excluded.vvnId,
          reason: 'Date filter exclusion'
        });
      }
    }
    
    return results;
  }

  /**
   * Update VVE
   * @param {string} vveId - VVE identifier
   * @param {Object} data - Update data
   * @returns {Promise<Object>}
   */
  async update(vveId, data) {
    const updated = await this.model.findOneAndUpdate(
      { vveId },
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).lean();
    
    if (!updated) {
      throw new Error(`VVE '${vveId}' not found`);
    }
    
    return updated;
  }

  /**
   * Delete VVE
   * @param {string} vveId - VVE identifier
   * @returns {Promise<boolean>} Success status
   */
  async delete(vveId) {
    const result = await this.model.deleteOne({ vveId });
    return result.deletedCount > 0;
  }

  /**
   * Check if VVE exists
   * @param {string} vveId - VVE identifier
   * @returns {Promise<boolean>}
   */
  async exists(vveId) {
    const count = await this.model.countDocuments({ vveId });
    return count > 0;
  }

  /**
   * Check if VVE exists for VVN
   * @param {string} vvnId - VVN identifier
   * @returns {Promise<boolean>}
   */
  async existsByVvnId(vvnId) {
    const count = await this.model.countDocuments({ vvnId });
    return count > 0;
  }

  /**
   * Count VVEs by status
   * @param {string} status - Status to filter
   * @returns {Promise<number>}
   */
  async countByStatus(status) {
    return await this.model.countDocuments({ status });
  }

  /**
   * Count all VVEs
   * @returns {Promise<number>}
   */
  async countAll() {
    return await this.model.countDocuments();
  }

  /**
   * Generate next VVE ID
   * Pattern: VVE-YYYYMMDD-XXXX
   * @returns {Promise<string>}
   */
  async generateNextId() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const datePrefix = `${year}${month}${day}`;
    
    // Find the latest VVE for today
    const todayPattern = new RegExp(`^VVE-${datePrefix}-`);
    const latestVve = await this.model.findOne({
      vveId: todayPattern
    }).sort({ vveId: -1 }).lean();
    
    let sequence = 1;
    if (latestVve) {
      // Extract sequence number and increment
      const match = latestVve.vveId.match(/-(\d{4})$/);
      if (match) {
        sequence = parseInt(match[1], 10) + 1;
      }
    }
    
    const sequenceStr = String(sequence).padStart(4, '0');
    return `VVE-${datePrefix}-${sequenceStr}`;
  }

  /**
   * Update operation status within a VVE
   * US 4.1.9 - Update executed operations
   * @param {string} vveId - VVE identifier
   * @param {string} operationId - Operation identifier
   * @param {Object} statusData - Status update data
   * @returns {Promise<Object>} Updated VVE
   */
  async updateOperationStatus(vveId, operationId, statusData) {
    // Find the VVE (not lean, so we can manipulate it)
    const vve = await this.model.findOne({ vveId });
    
    if (!vve) {
      throw new Error(`VVE '${vveId}' not found`);
    }

    // Find if this operation already exists in executedOperations
    let operation = vve.executedOperations.find(op => op.operationId === operationId);

    if (!operation) {
      // First time tracking this operation - create new entry
      const newOperation = {
        operationId,
        name: statusData.name || '',
        type: statusData.type || 'Other',
        status: statusData.status,
        startTime: statusData.status === 'STARTED' ? statusData.timestamp : null,
        startedBy: statusData.status === 'STARTED' ? statusData.operatorId : null,
        endTime: statusData.status === 'COMPLETED' ? statusData.timestamp : null,
        completedBy: statusData.status === 'COMPLETED' ? statusData.operatorId : null,
        actualResource: statusData.resourceId || null,
        notes: statusData.notes || '',
      };
      vve.executedOperations.push(newOperation);
    } else {
      // Update existing operation
      operation.status = statusData.status;
      
      if (statusData.status === 'STARTED') {
        operation.startTime = statusData.timestamp;
        operation.startedBy = statusData.operatorId;
      }
      
      if (statusData.status === 'COMPLETED') {
        operation.endTime = statusData.timestamp;
        operation.completedBy = statusData.operatorId;
      }
      
      if (statusData.status === 'SUSPENDED') {
        // Just update status, keep existing timestamps
      }
      
      if (statusData.resourceId) {
        operation.actualResource = statusData.resourceId;
      }
      
      if (statusData.name) {
        operation.name = statusData.name;
      }
      
      if (statusData.type) {
        operation.type = statusData.type;
      }
      
      if (statusData.notes) {
        operation.notes = statusData.notes;
      }
      
      if (statusData.type) {
        operation.type = statusData.type;
      }
      
      if (statusData.notes) {
        operation.notes = statusData.notes;
      }
    }

    // Save and return
    vve.updatedAt = new Date();
    await vve.save();
    
    return vve.toObject();
  }
}
