import mongoose from 'mongoose';

const operationPlanSchema = new mongoose.Schema({
    planId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    date: {
        type: String, // YYYY-MM-DD
        required: true,
        index: true
    },
    algorithm: {
        type: String,
        required: true
    },
    geneticParams: {
        populationSize: Number,
        generations: Number,
        mutationRate: Number,
        desiredTimeSeconds: Number,
        craneMode: String
    },
    createdBy: {
        type: String, // User Email/ID from Token
        required: true
    },
    status: {
        type: String,
        enum: ['Draft', 'Confirmed', 'Executed'],
        default: 'Confirmed'
    },
    metrics: {
        totalDelay: Number,
        executionTimeMs: Number
    },
    scheduledTasks: [{
        vesselVisitId: String,
        vesselVisitBusinessId: String,
        dockName: String,
        dockId: String,
        resourceKind: String,
        resourceId: String,
        staffShortName: String,
        staffId: String,
        startTime: Date,
        endTime: Date
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

// Index for faster queries on date
operationPlanSchema.index({ date: -1 });

export const OperationPlanModel = mongoose.model('OperationPlan', operationPlanSchema);