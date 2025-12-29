import mongoose from 'mongoose';

const GROUPS = [
    'Safety and Security',
    'Maintenance',
    'Cleaning and Housekeeping',
    'Bunkering and Supply',
    'Crew and Personnel',
    'Regulatory and Surveys',
    'Weather and External Delays',
    'Other',
];

const complementaryTaskCategorySchema = new mongoose.Schema({
    categoryId: { type: String, required: true, unique: true }, // Business ID (e.g., CTC-2025-001)
    code: { type: String, required: true, unique: true },       // Unique code (e.g., "CTC001")
    name: { type: String, required: true },
    description: { type: String, default: '' },
    defaultDurationMinutes: { type: Number, default: null },     // optional
    expectedImpactMinutes: { type: Number, default: null },      // optional
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    group: { type: String, enum: GROUPS, default: 'Other' },     

});

// Helpful indexes for filtering/search
complementaryTaskCategorySchema.index({ code: 1 });
complementaryTaskCategorySchema.index({ isActive: 1 });
complementaryTaskCategorySchema.index({ group: 1 });
complementaryTaskCategorySchema.index({ expectedImpactMinutes: 1 });

export default mongoose.model('ComplementaryTaskCategory', complementaryTaskCategorySchema);