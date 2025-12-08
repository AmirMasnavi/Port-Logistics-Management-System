import mongoose from 'mongoose';

const operationPlanSchema = new mongoose.Schema({
    planId: { type: String }, // Removi required true temporariamente se o gerador falhar
    date: { type: String },
    algorithm: { type: String },
    // Permite que metrics receba qualquer coisa ou nada
    metrics: {
        totalDelay: Number,
        executionTimeMs: Number
    },
    // Array genérico - Aceita qualquer objeto lá dentro, sem validar campos específicos
    scheduledTasks: [],
    createdBy: { type: String },
    status: { type: String, default: 'Confirmed' },
    createdAt: { type: Date, default: Date.now }
}, { strict: false }); // <--- IMPORTANTE: strict: false permite salvar campos extra

export const OperationPlanModel = mongoose.model('OperationPlan', operationPlanSchema);