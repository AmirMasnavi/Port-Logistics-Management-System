// javascript
import mongoose from 'mongoose';

/**
 * Incident Type Mongoose Schema
 * Infrastructure Layer - Persistence Model
 */
const incidentTypeSchema = new mongoose.Schema({
    // Unique business code (ex: T-INC001)
    code: {
        type: String,
        required: true,
        unique: true,
        index: true,
        maxlength: 32,
    },

    // Human friendly name
    name: {
        type: String,
        required: true,
        maxlength: 128,
    },

    // Optional detailed description
    description: {
        type: String,
        default: null,
    },

    // Severity enum
    severity: {
        type: String,
        enum: ['Minor', 'Major', 'Critical'],
        default: 'Minor',
        required: true,
        index: true,
    },

    // Optional parent id stored as GUID/string (useful for queries without population)
    parentId: {
        type: String,
        default: null,
        index: true,
    },
  
    // Audit / metadata
    createdBy: {
        type: String,
        default: null,
    },
    updatedBy: {
        type: String,
        default: null,
    },

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now,
        index: true,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },

    // Optional: children count or other computed fields can be added later
});

// Keep updatedAt current
incidentTypeSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// Create useful indexes
incidentTypeSchema.index({ code: 1 }, { unique: true });
incidentTypeSchema.index({ parentId: 1 });
incidentTypeSchema.index({ severity: 1 });
incidentTypeSchema.index({ createdAt: -1 });

export const IncidentTypeModel = mongoose.model('IncidentType', incidentTypeSchema);