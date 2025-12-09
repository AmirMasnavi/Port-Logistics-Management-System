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
    // Explicitly define this to meet the User Story requirement
    scheduledTasks: [{
        vesselVisitId: String,
        dockId: String,
        resourceId: String, // "Assigned Resources"
        startTime: Date,    // "Planned Time Windows"
        endTime: Date       // "Planned Time Windows"
    }],
    createdAt: { type: Date, default: Date.now }
});

// Remove { strict: false } to enforce data quality
export const OperationPlanModel = mongoose.model('OperationPlan', operationPlanSchema);