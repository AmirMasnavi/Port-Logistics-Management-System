// src/application/utils/SmartOperationGenerator.js

/**
 * Smart Operation Generator
 * Generates realistic sub-operations for loading/unloading cargo based on task type.
 */

/**
 * Generate detailed operations from a scheduled task
 * @param {Object} task - Scheduled task from operation plan
 * @returns {Array<Object>} Array of detailed operation objects
 */
export const generateSmartOperations = (task) => {
    const startTime = new Date(task.startTime);
    const endTime = new Date(task.endTime);
    const totalDurationMs = endTime - startTime;

    // Determine operation base type from task type
    const taskType = (task.type || 'Operation').toLowerCase();
    const isLoading = taskType.includes('load') && !taskType.includes('unload');
    const isUnloading = taskType.includes('unload');
    
    // Determine the operation type
    let operationType = 'Other';
    if (isLoading) {
        operationType = 'Loading';
    } else if (isUnloading) {
        operationType = 'Unloading';
    }

    // --- TIME ALLOCATION LOGIC ---

    // 1. Preparation Phase (15% of total time, max 45 mins)
    let prepDuration = Math.min(totalDurationMs * 0.15, 45 * 60 * 1000);

    // 2. Completion Phase (10% of total time, max 30 mins)
    let completionDuration = Math.min(totalDurationMs * 0.10, 30 * 60 * 1000);

    // 3. Execution Phase (The rest, split into multiple parts)
    let executionDuration = totalDurationMs - prepDuration - completionDuration;

    // For very short tasks (under 30 mins), create a single operation
    if (totalDurationMs < 30 * 60 * 1000) {
        return [
            {
                operationId: `${task._id}_single`,
                parentTaskId: task._id,
                name: isLoading ? 'Load Cargo' : isUnloading ? 'Unload Cargo' : 'Execute Operation',
                type: operationType,
                resourceId: task.resourceId,
                plannedStartTime: startTime.toISOString(),
                plannedEndTime: endTime.toISOString(),
                status: 'PENDING',
            },
        ];
    }

    const operations = [];
    let currentTime = startTime.getTime();

    // --- HELPER: Add Operation ---
    const addOp = (suffix, name, type, duration) => {
        const opStart = new Date(currentTime);
        const opEnd = new Date(currentTime + duration);

        operations.push({
            operationId: `${task._id}_${suffix}`,
            parentTaskId: task._id,
            name: name,
            type: type,
            resourceId: task.resourceId,
            plannedStartTime: opStart.toISOString(),
            plannedEndTime: opEnd.toISOString(),
            status: 'PENDING',
        });

        currentTime += duration;
    };

    // --- PHASE 1: PREPARATION ---
    if (isLoading) {
        addOp('prep', 'Pre-Loading Safety Inspection', 'Preparation', prepDuration);
    } else if (isUnloading) {
        addOp('prep', 'Pre-Unloading Safety Inspection', 'Preparation', prepDuration);
    } else {
        addOp('prep', 'Equipment Setup & Safety Check', 'Preparation', prepDuration);
    }

    // --- PHASE 2: EXECUTION (Split into realistic cargo handling phases) ---
    if (isLoading) {
        // Loading operations: Position → Lift → Transfer → Place
        const phaseTime = executionDuration / 2;
        
        addOp('exec_1', 'Cargo Transfer: Dock to Vessel', 'Loading', phaseTime);
        addOp('exec_2', 'Cargo Stowage & Securing', 'Loading', phaseTime);
        
    } else if (isUnloading) {
        // Unloading operations: Release → Lift → Transfer → Place
        const phaseTime = executionDuration / 2;
        
        addOp('exec_1', 'Cargo Release & Lifting', 'Unloading', phaseTime);
        addOp('exec_2', 'Cargo Transfer: Vessel to Dock', 'Unloading', phaseTime);
        
    } else {
        // Generic operations for other task types
        const phaseTime = executionDuration / 2;
        addOp('exec_1', 'Primary Operation Execution (Part 1)', operationType, phaseTime);
        addOp('exec_2', 'Primary Operation Execution (Part 2)', operationType, phaseTime);
    }

    // --- PHASE 3: COMPLETION ---
    if (isLoading) {
        addOp('comp', 'Loading Completion & Documentation', 'Completion', completionDuration);
    } else if (isUnloading) {
        addOp('comp', 'Unloading Completion & Documentation', 'Completion', completionDuration);
    } else {
        addOp('comp', 'Operation Completion & Teardown', 'Completion', completionDuration);
    }

    return operations;
};

/**
 * Merge generated operations with saved execution data
 * @param {Array} generatedOps - Operations generated from task
 * @param {Array} executedOps - Operations saved in VVE database
 * @returns {Array} - Merged operations with actual status
 */
export const mergeOperationsWithExecutionData = (generatedOps, executedOps) => {
    return generatedOps.map(virtualOp => {
        // Find matching saved operation
        const savedOp = executedOps.find(
            s => s.operationId === virtualOp.operationId
        );
        
        if (savedOp) {
            // Found saved status - use it
            return {
                ...virtualOp,
                // Override name and type if they were customized in the saved operation
                name: savedOp.name || virtualOp.name,
                type: savedOp.type || virtualOp.type,
                
                executedStatus: savedOp.status, // Map status to executedStatus for frontend
                computedStatus: savedOp.status, // Use saved status as computed status
                
                actualStartTime: savedOp.startTime,
                actualEndTime: savedOp.endTime,
                startedBy: savedOp.startedBy,
                completedBy: savedOp.completedBy,
                actualResource: savedOp.actualResource,
                notes: savedOp.notes || '',
            };
        }
        
        // Return the default generated operation
        return {
            ...virtualOp,
            computedStatus: virtualOp.status || 'PENDING'
        };
    });
};
