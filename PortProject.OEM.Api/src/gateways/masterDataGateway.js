import axios from 'axios';

/**
 * Gateway for communicating with Master Data API
 * Equivalent to MasterDataGateway.cs
 */
export class MasterDataGateway {
  constructor(baseUrl, authToken = null) {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Add Authorization header if token is provided
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
      console.log(`[MasterDataGateway] Initialized with authentication token`);
    } else {
      console.log(`[MasterDataGateway] Initialized WITHOUT authentication token - requests may fail!`);
    }
    
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 10000,
      headers: headers,
    });

    console.log(`[MasterDataGateway] Initialized with base URL: ${baseUrl}`);
  }
  
  /**
   * Update the authorization token (useful if token expires and needs refresh)
   */
  setAuthToken(token) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log(`[MasterDataGateway] Authorization token updated`);
  }

  /**
   * Get Vessel Visit Notification by Business ID
   * Equivalent to GetVvnAsync in C#
   * @param {string} businessId - The VVN business identifier
   * @returns {Promise<Object|null>} VVN data or null
   */
  async getVvnAsync(businessId) {
    try {
      const response = await this.client.get(`/api/notifications/${businessId}`);
      
      if (response.status === 200) {
        return response.data;
      }
      
      console.log(`[MasterDataGateway] Failed to get VVN ${businessId}. Status: ${response.status}`);
      return null;
      
    } catch (error) {
      if (error.response) {
        // Server responded with error status
        console.log(`[MasterDataGateway] Failed to get VVN ${businessId}. Status: ${error.response.status}`);
      } else {
        // Network error or timeout
        console.error(`[MasterDataGateway] Error fetching VVN: ${error.message}`);
      }
      return null;
    }
  }

  /**
   * Add more gateway methods here as needed
   * For example:
   * - getVesselAsync(imoNumber)
   * - getDockAsync(dockId)
   * - getResourceAsync(resourceId)
   */
}

