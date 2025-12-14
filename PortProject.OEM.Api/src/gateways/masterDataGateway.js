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
   * Get pending Vessel Visit Notifications for a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Array>} Array of pending VVNs
   */
  async getPendingVisitsAsync(date) {
    try {
      // Convert date to datetime range
      const fromDateTime = new Date(date + 'T00:00:00').toISOString();
      const toDateTime = new Date(date + 'T23:59:59').toISOString();
      
      const url = `/api/notifications/search?status=Submitted&from=${encodeURIComponent(fromDateTime)}&to=${encodeURIComponent(toDateTime)}`;
      
      console.log(`[MasterDataGateway] Fetching pending visits for date: ${date}`);
      console.log(`[MasterDataGateway] URL: ${url}`);
      
      const response = await this.client.get(url);
      
      if (response.status === 200) {
        console.log(`[MasterDataGateway] Found ${response.data.length} pending visits`);
        return response.data;
      }
      
      console.log(`[MasterDataGateway] Failed to get pending visits. Status: ${response.status}`);
      return [];
      
    } catch (error) {
      if (error.response) {
        console.log(`[MasterDataGateway] Failed to get pending visits. Status: ${error.response.status}`);
      } else {
        console.error(`[MasterDataGateway] Error fetching pending visits: ${error.message}`);
      }
      return [];
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

