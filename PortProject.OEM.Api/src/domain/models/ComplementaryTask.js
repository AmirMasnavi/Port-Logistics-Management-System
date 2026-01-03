import mongoose from 'mongoose';

/**
 * ComplementaryTask Model
 * Tracks non-cargo activities during vessel visits (inspections, cleaning, maintenance, etc.)
 */
const complementaryTaskSchema = new mongoose.Schema({
    // Business ID (e.g., CT-2026-001)
    taskId: { 
        type: String, 
        required: true, 
        unique: true 
    },
    
    // Reference to the Complementary Task Category
    categoryId: { 
        type: String, 
        required: true,
        index: true
    },
    
    // Reference to the Vessel Visit Execution (VVE)
    vveId: { 
        type: String, 
        required: true,
        index: true
    },
    
    // Task description/notes
    description: { 
        type: String, 
        default: '' 
    },
    
    // Responsible team or service (e.g., "Safety Team", "Maintenance Crew")
    responsibleTeam: { 
        type: String, 
        required: true 
    },
    
    // Time window for the task
    startTime: { 
        type: Date, 
        required: true,
        index: true
    },
    
    endTime: { 
        type: Date, 
        default: null 
    },
    
    // Completion status
    status: {
        type: String,
        enum: ['PENDING', 'ONGOING', 'COMPLETED', 'CANCELLED'],
        default: 'PENDING',
        required: true,
        index: true
    },
    
    // Does this task suspend cargo operations?
    // true = suspends operations (e.g., maintenance, safety procedure)
    // false = runs in parallel (e.g., inspection)
    suspendsOperations: {
        type: Boolean,
        default: false,
        required: true
    },
    
    // Audit fields
    createdBy: { 
        type: String, 
        required: true 
    },
    
    createdAt: { 
        type: Date, 
        default: Date.now,
        index: true
    },
    
    updatedBy: { 
        type: String, 
        default: null 
    },
    
    updatedAt: { 
        type: Date, 
        default: null 
    }
});

// Compound indexes for filtering
complementaryTaskSchema.index({ vveId: 1, status: 1 });
complementaryTaskSchema.index({ vveId: 1, startTime: 1 });
complementaryTaskSchema.index({ status: 1, suspendsOperations: 1 });
complementaryTaskSchema.index({ startTime: 1, endTime: 1 });

// Virtual for duration in minutes
complementaryTaskSchema.virtual('durationMinutes').get(function() {
    if (this.endTime && this.startTime) {
        return Math.floor((this.endTime - this.startTime) / 60000);
    }
    return null;
});

// Ensure virtuals are included in JSON output
complementaryTaskSchema.set('toJSON', { virtuals: true });
complementaryTaskSchema.set('toObject', { virtuals: true });

export default mongoose.model('ComplementaryTask', complementaryTaskSchema);

