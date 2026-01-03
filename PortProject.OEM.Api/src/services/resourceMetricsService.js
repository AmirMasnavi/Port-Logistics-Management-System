/**
 * US 4.1.6 - Resource Allocation Metrics Service
 * Calculates how long a resource was allocated within a period
 */
import { OperationPlanRepository } from '../infrastructure/repositories/OperationPlanRepository.js';

export class ResourceMetricsService {
    constructor(repository = new OperationPlanRepository()) {
        this.repository = repository;
    }

    /**
     * Get resource allocation summary for a specific resource within a time period
     * @param {string} resourceType - 'crane' | 'dock' | 'staff'
     * @param {string} resourceId - The resource identifier (e.g., 'CR-01', 'DOCK-A', 'MEC001')
     * @param {Date} from - Start of the period (UTC)
     * @param {Date} to - End of the period (UTC)
     * @returns {Promise<Object>} Allocation summary with total time and operation count
     */
    async getResourceAllocationSummary(resourceType, resourceId, from, to) {
        // Validate inputs
        if (!resourceType || !resourceId || !from || !to) {
            throw new Error('Missing required parameters: resourceType, resourceId, from, to');
        }

        const fromDate = new Date(from);
        const toDate = new Date(to);

        if (toDate <= fromDate) {
            throw new Error('End date must be after start date');
        }

        // Fetch all saved/confirmed plans that might overlap with the period
        // We'll filter by status = 'Confirmed' (saved plans)
        const allPlans = await this.repository.findAll({});
        
        // Filter only confirmed plans (saved plans)
        const confirmedPlans = allPlans.filter(plan => 
            plan.status === 'Confirmed' || plan.status === 'Executed'
        );

        let totalAllocatedMinutes = 0;
        const operationIds = new Set();

        for (const plan of confirmedPlans) {
            if (!plan.scheduledTasks || plan.scheduledTasks.length === 0) {
                continue;
            }

            for (const task of plan.scheduledTasks) {
                // Check if this task matches the resource type and ID
                const matchesResource = this._matchesResource(task, resourceType, resourceId);
                
                if (!matchesResource) {
                    continue;
                }

                const taskStart = new Date(task.startTime);
                const taskEnd = new Date(task.endTime);

                // Check if task overlaps with the requested period
                if (taskEnd <= fromDate || taskStart >= toDate) {
                    continue; // No overlap
                }

                // Calculate overlap duration (clipped to period boundaries)
                const effectiveStart = taskStart < fromDate ? fromDate : taskStart;
                const effectiveEnd = taskEnd > toDate ? toDate : taskEnd;

                const durationMinutes = Math.round((effectiveEnd - effectiveStart) / (1000 * 60));
                
                if (durationMinutes > 0) {
                    totalAllocatedMinutes += durationMinutes;
                    // Use a unique identifier for the operation
                    const operationKey = `${plan.planId}-${task._id || task.vesselVisitId}`;
                    operationIds.add(operationKey);
                }
            }
        }

        return {
            resourceType: resourceType,
            resourceId: resourceId,
            period: {
                from: fromDate.toISOString(),
                to: toDate.toISOString()
            },
            totalAllocatedMinutes: totalAllocatedMinutes,
            totalAllocatedHours: Math.round((totalAllocatedMinutes / 60) * 100) / 100,
            numberOfOperations: operationIds.size
        };
    }

    /**
     * Get allocation breakdown by day within a period
     * @param {string} resourceType - 'crane' | 'dock' | 'staff'
     * @param {string} resourceId - The resource identifier
     * @param {Date} from - Start of the period (UTC)
     * @param {Date} to - End of the period (UTC)
     * @returns {Promise<Object>} Daily breakdown of allocations
     */
    async getResourceAllocationBreakdown(resourceType, resourceId, from, to) {
        const fromDate = new Date(from);
        const toDate = new Date(to);

        if (toDate <= fromDate) {
            throw new Error('End date must be after start date');
        }

        const dailyBreakdown = [];
        let currentDate = new Date(fromDate);
        currentDate.setUTCHours(0, 0, 0, 0);

        while (currentDate < toDate) {
            const dayStart = new Date(currentDate);
            const dayEnd = new Date(currentDate);
            dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

            // Clip to period boundaries
            const effectiveDayStart = dayStart < fromDate ? fromDate : dayStart;
            const effectiveDayEnd = dayEnd > toDate ? toDate : dayEnd;

            const daySummary = await this.getResourceAllocationSummary(
                resourceType, 
                resourceId, 
                effectiveDayStart, 
                effectiveDayEnd
            );

            dailyBreakdown.push({
                date: dayStart.toISOString().split('T')[0],
                allocatedMinutes: daySummary.totalAllocatedMinutes,
                allocatedHours: daySummary.totalAllocatedHours,
                operationCount: daySummary.numberOfOperations
            });

            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }

        // Calculate totals
        const totalMinutes = dailyBreakdown.reduce((sum, day) => sum + day.allocatedMinutes, 0);
        const totalOperations = dailyBreakdown.reduce((sum, day) => sum + day.operationCount, 0);

        return {
            resourceType: resourceType,
            resourceId: resourceId,
            period: {
                from: fromDate.toISOString(),
                to: toDate.toISOString()
            },
            totalAllocatedMinutes: totalMinutes,
            totalAllocatedHours: Math.round((totalMinutes / 60) * 100) / 100,
            numberOfOperations: totalOperations,
            breakdownByDay: dailyBreakdown
        };
    }

    /**
     * Check if a task matches the given resource type and ID
     * @private
     */
    _matchesResource(task, resourceType, resourceId) {
        const type = resourceType.toLowerCase();
        const id = resourceId.toLowerCase();

        switch (type) {
            case 'crane':
            case 'resource':
                // Match by resourceId or resourceKind
                const taskResourceId = (task.resourceId || '').toLowerCase();
                const taskResourceKind = (task.resourceKind || '').toLowerCase();
                return taskResourceId === id || 
                       (taskResourceKind === 'crane' && taskResourceId === id);

            case 'dock':
                const taskDockId = (task.dockId || '').toLowerCase();
                const taskDockName = (task.dockName || '').toLowerCase();
                return taskDockId === id || taskDockName === id;

            case 'staff':
                const taskStaffId = (task.staffId || '').toLowerCase();
                const taskStaffName = (task.staffShortName || '').toLowerCase();
                return taskStaffId === id || taskStaffName === id;

            default:
                return false;
        }
    }
}

