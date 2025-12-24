import mongoose from 'mongoose';

const incidentSchema = new mongoose.Schema({
    incidentId: { type: String, required: true, unique: true }, // Business ID (e.g., INC-2025-001)
    title: { type: String, required: true },
    description: { type: String },
    
    // LINK TO YOUR PREVIOUS WORK (US 4.1.12)
    incidentTypeId: { type: String, required: true },
    
    severity: {
        type: String,
        enum: ['Minor', 'Major', 'Critical'],
        required: true
    },
    status: {
        type: String,
        enum: ['Active', 'Resolved'],
        default: 'Active'
    },
    
    // Time tracking
    startTime: { type: Date, required: true },
    endTime: { type: Date, default: null },
    durationMinutes: { type: Number, default: 0 }, // Auto-calculated
    
    // Scope (Which VVEs are hurt by this?)
    affectedVves: [{ type: String }], // Array of Vessel Visit IDs
    
    createdBy: { type: String, required: true }, // Operator Email/ID
    createdAt: { type: Date, default: Date.now }
});

// Index for the "Filter" requirement in US 4.1.13
incidentSchema.index({ status: 1, startTime: 1, severity: 1 });

export default mongoose.model('Incident', incidentSchema);

