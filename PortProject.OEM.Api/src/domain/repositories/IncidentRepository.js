import Incident from '../models/Incident.js';

export class IncidentRepository {
    
    async create(data) {
        const incident = new Incident(data);
        return await incident.save();
    }

    async findById(incidentId) {
        return await Incident.findOne({ incidentId });
    }

    async update(incidentId, data) {
        return await Incident.findOneAndUpdate(
            { incidentId },
            data,
            { new: true } // Return the updated version
        );
    }

    // Supports: Filter by Vessel, Date, Severity, Status
    async search(filters) {
        const query = {};

        if (filters.status) query.status = filters.status;
        if (filters.severity) query.severity = filters.severity;
        
        // Date Range Logic
        if (filters.startDate && filters.endDate) {
            query.startTime = {
                $gte: new Date(filters.startDate),
                $lte: new Date(filters.endDate)
            };
        }

        // Check if a specific VVE is in the affected list
        if (filters.vveId) {
            query.affectedVves = filters.vveId;
        }

        return await Incident.find(query).sort({ startTime: -1 });
    }

    async delete(incidentId) {
        return await Incident.findOneAndDelete({ incidentId });
    }
}

