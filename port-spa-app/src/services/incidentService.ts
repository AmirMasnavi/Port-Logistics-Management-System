// Service singleton for Incident management
// This file provides a simple interface for components to use

import { IncidentService } from '../app/incident/incident.service';
import { incidentApiRepository } from '../infrastructure/repositories/incident/incidentApi.repository';
import type { IncidentFilters } from '../app/incident/incident.repository';
import type { CreateIncidentDto, UpdateIncidentDto } from '../infrastructure/repositories/incident/incident.dto';

// Create singleton instance
const incidentService = new IncidentService(incidentApiRepository);

// Export convenience methods
export const getIncidents = (filters?: IncidentFilters) => 
    incidentService.fetchAllIncidents(filters);

export const getIncidentById = (id: string) => 
    incidentService.getIncidentById(id);

export const reportIncident = (dto: CreateIncidentDto) => 
    incidentService.reportIncident(dto);

export const updateIncident = (id: string, dto: UpdateIncidentDto) => 
    incidentService.updateIncident(id, dto);

export const resolveIncident = (id: string) => 
    incidentService.resolveIncident(id);

export const deleteIncident = (id: string) => 
    incidentService.deleteIncident(id);

// Export types for convenience
export type { IncidentFilters };
export type { CreateIncidentDto, UpdateIncidentDto };

