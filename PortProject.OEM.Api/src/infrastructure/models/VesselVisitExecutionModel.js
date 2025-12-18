import mongoose from 'mongoose';

/**
 * Vessel Visit Execution (VVE) Mongoose Schema
 * Infrastructure Layer - Persistence Model
 */
const vesselVisitExecutionSchema = new mongoose.Schema({
  // VVE Identifier (auto-generated, similar pattern to VVN)
  vveId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  
  // Reference to the VVN (Vessel Visit Notification) from Master Data
  vvnId: {
    type: String,
    required: true,
  },
  
  // Vessel identifier (IMO number or other identifier)
  vesselIdentifier: {
    type: String,
    required: true,
  },
  
  // Actual arrival time at the port
  actualArrivalTime: {
    type: Date,
    required: true,
  },

    // Novo: actual berth time (horário de acostagem efetivo)
    actualBerthTime: {
        type: Date,
        default: null,
    },
    // Novo: dock/berth efetivamente usado (ID)
    berthDockId: {
        type: String,
        default: null,
        index: true,
    },
  
  // Creator user ID (from Firebase authentication)
  creatorUserId: {
    type: String,
    required: true,
  },
  
  // Execution status
  status: {
    type: String,
    enum: ['In Progress', 'Completed', 'Cancelled'],
    default: 'In Progress',
    required: true,
  },
  
  // Optional: Actual departure time (set when completed)
  actualDepartureTime: {
    type: Date,
    default: null,
  },
  
  // Optional: Additional notes or comments
  notes: {
    type: String,
    default: '',
  },

    auditLogs: [
        {
            userId: { type: String, required: true },
            action: { type: String, required: true }, // e.g. 'update'
            timestamp: { type: Date, default: Date.now },
            details: { type: mongoose.Schema.Types.Mixed },
        },
    ],
  
  // Timestamps for audit trail
  createdAt: {
    type: Date,
    default: Date.now,
  },
  
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
vesselVisitExecutionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create indexes for better query performance
vesselVisitExecutionSchema.index({ vvnId: 1 });
vesselVisitExecutionSchema.index({ status: 1 });
vesselVisitExecutionSchema.index({ createdAt: -1 });

export const VesselVisitExecutionModel = mongoose.model('VesselVisitExecution', vesselVisitExecutionSchema);
