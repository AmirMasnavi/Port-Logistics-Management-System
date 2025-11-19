// This file creates and exports a single instance of the VesselService
// with the API repository implementation.
// This is what the UI components will import and use.

import { VesselService } from './vessel.service';
import { vesselApiRepository } from '../../infrastructure/repositories/vessel/vesselApi.repository';

// Create a single instance with the API repository
export const vesselService = new VesselService(vesselApiRepository);
