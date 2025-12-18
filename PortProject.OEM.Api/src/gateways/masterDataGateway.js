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
   * Fetch Staff Member details by ID
   * Compatible with .NET API responses
   */
  async getStaffById(staffId) {
    try {
      // Adjust the URL to match your .NET Staff Controller
      // Usually: GET http://localhost:5000/api/staff/{id}
      console.log(`[Gateway] Fetching staff details for: ${staffId}`);

      const response = await this.client.get(`/api/StaffMembers/${staffId}`);

      // Log the response to debug if the name field is 'shortName' or 'ShortName'
      console.log(`[Gateway] Found staff:`, response.data);

      return response.data;
    } catch (error) {
      console.error(`[Gateway] Failed to fetch staff ${staffId}:`, error.message);
      return null;
    }
  }

  /**
   * Fetch all Staff Members
   */
  async getAllStaff() {
    try {
      console.log(`[Gateway] Fetching all staff members`);
      const response = await this.client.get(`/api/StaffMembers`);
      return response.data;
    } catch (error) {
      console.error(`[Gateway] Failed to fetch all staff:`, error.message);
      return [];
    }
  }

  /**
   * Fetch all Resources
   */
  async getAllResources() {
    try {
      console.log(`[Gateway] Fetching all resources`);
      const response = await this.client.get(`/api/Resource`);
      return response.data;
    } catch (error) {
      console.error(`[Gateway] Failed to fetch all resources:`, error.message);
      return [];
    }
  }

  /**
   * Fetch Resource details by ID (Code)
   */
  async getResourceById(resourceId) {
    try {
      console.log(`[Gateway] Fetching resource details for: ${resourceId}`);
      const response = await this.client.get(`/api/Resource/${resourceId}`);
      return response.data;
    } catch (error) {
      console.error(`[Gateway] Failed to fetch resource ${resourceId}:`, error.message);
      return null;
    }
  }
}
