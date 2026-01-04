// src/application/utils/SmartOperationGenerator.js

/**
 * Smart Operation Generator
 * Generates realistic sub-operations for loading/unloading cargo based on task type.
 */

/**
 * Generates operations for US 4.1.9 and US 4.2.4 (3D Model Support)
 * Structure: WAITING -> UNLOADING -> LOADING
 * @param {Object} task - Scheduled task from operation plan
 * @param {Date|null} actualStartTime - Optional actual start time to shift operations
 * @returns {Array<Object>} Array of detailed operation objects
 */
export const generateSmartOperations = (task, actualStartTime = null) => {
    const startTime = new Date(task.startTime);
    const endTime = new Date(task.endTime);
    const totalDurationMs = endTime - startTime;

    // Calculate time offset if actualStartTime is provided
    let timeOffset = 0;
    if (actualStartTime) {
        timeOffset = new Date(actualStartTime).getTime() - startTime.getTime();
    }

    // --- TIME SPLIT STRATEGY ---
    // 1. WAITING: 10% of time (Max 30 mins)
    let waitDuration = Math.min(totalDurationMs * 0.10, 30 * 60 * 1000);
    
    // 2. WORKING TIME: The rest
    let workingDuration = totalDurationMs - waitDuration;
    
    // 3. SPLIT WORK: 50% Unload, 50% Load (Standard Turnaround)
    let unloadDuration = workingDuration / 2;
    let loadDuration = workingDuration / 2;

    const operations = [];
    let currentTime = startTime.getTime() + timeOffset;

    // Helper to add tasks
    const addOp = (suffix, name, type, duration) => {
        const opStart = new Date(currentTime);
        const opEnd = new Date(currentTime + duration);
        
        operations.push({
            operationId: `${task._id || task.id || 'task'}_${suffix}`,
            parentTaskId: task._id || task.id,
            name: name,
            type: type, // THIS IS KEY FOR 3D MODEL: 'WAITING', 'UNLOADING', 'LOADING'
            resourceId: task.resourceId,
            plannedStartTime: opStart.toISOString(),
            plannedEndTime: opEnd.toISOString(),
            actualStartTime: opStart.toISOString(),  // Initialize with planned time
            actualEndTime: opEnd.toISOString(),      // Initialize with planned time
            status: "PENDING"
        });
        
        currentTime += duration;
    };

    // --- PHASE 1: WAITING (The Setup) ---
    // Subtask 1: Safety & Positioning
    addOp("wait_1", "Safety Clearance & Positioning", "WAITING", waitDuration);

    // --- PHASE 2: UNLOADING (Removing Cargo) ---
    // Subtask 1: Hatch / Deck Clearing
    addOp("unload_1", "Deck/Hatch Clearance", "UNLOADING", unloadDuration * 0.2); 
    // Subtask 2: Main Discharge
    addOp("unload_2", "Principal Cargo Discharge", "UNLOADING", unloadDuration * 0.8);

    // --- PHASE 3: LOADING (Adding Cargo) ---
    // Subtask 1: Main Loading
    addOp("load_1", "Principal Cargo Loading", "LOADING", loadDuration * 0.8);
    // Subtask 2: Securing
    addOp("load_2", "Lashing & Securing", "LOADING", loadDuration * 0.2);

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
