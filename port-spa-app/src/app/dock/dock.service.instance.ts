// This file creates and exports a single instance of the VesselTypeService
// with the API repository implementation.
// This is what the UI components will import and use.

import { DockService } from './dock.service';
import { dockApiRepository } from '../../infrastructure/repositories/dock/dockApi.repository';

// Create a single instance with the API repository
export const dockService = new DockService(dockApiRepository);

