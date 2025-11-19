// This file creates and exports a single instance of the VesselTypeService
// with the API repository implementation.
// This is what the UI components will import and use.

import { VesselTypeService } from './vesselType.service';
import { vesselTypeApiRepository } from '../../infrastructure/repositories/vesselType/vesselTypeApi.repository';

// Create a single instance with the API repository
export const vesselTypeService = new VesselTypeService(vesselTypeApiRepository);

