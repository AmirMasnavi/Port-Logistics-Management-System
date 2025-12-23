import mongoose from 'mongoose';

const operationPlanSchema = new mongoose.Schema({
    planId: { type: String, required: true, unique: true, index: true },
    date: { type: String, required: true, index: true },
    algorithm: { type: String, required: true },
    geneticParams: {
        populationSize: Number,
        generations: Number,
        mutationRate: Number,
        desiredTimeSeconds: Number,
        craneMode: String
    },
    createdBy: { type: String, required: true },
    status: { type: String, enum: ['Draft', 'Confirmed', 'Executed'], default: 'Confirmed' },
    metrics: {
        totalDelay: Number,
        executionTimeMs: Number
    },
    changeLogs: [{
        timestamp: { type: Date, default: Date.now },
        author: String,      // Who did it?
        reason: String,      // Why? (User input)
        details: String      // What changed? (e.g., "Moved Task X to Crane 2")
    }],
    // Explicitly define this to meet the User Story requirement
    scheduledTasks: [{
        vesselVisitId: String,
        resourceId: String,
        staffId: String,
        dockId: String,
        
        // Display names (for UI - user-friendly names instead of IDs)
        vesselImo: String,
        vesselVisitBusinessId: String,
        dockName: String,
        resourceKind: String,
        staffShortName: String,
        
        startTime: Date,
        endTime: Date,
        
        // Loading and Unloading times (in hours)
        loadingTime: Number,
        unloadingTime: Number
    }],
    createdAt: { type: Date, default: Date.now }
});

// Remove { strict: false } to enforce data quality
export const OperationPlanModel = mongoose.model('OperationPlan', operationPlanSchema);