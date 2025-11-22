import { shippingAgentApiRepository } from '../../infrastructure/repositories/shippingAgent/shippingAgentApi.repository';
import { ShippingAgentService } from './shippingAgent.service';

// Centralized service instance: composition root for the ShippingAgent feature.
// This keeps pages/controllers from needing to construct the service with a concrete repository.
export const shippingAgentService = new ShippingAgentService(shippingAgentApiRepository);

