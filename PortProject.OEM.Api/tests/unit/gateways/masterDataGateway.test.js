/**
 * Unit Tests for MasterDataGateway
 * 
 * Type: Functional Black-Box Testing with SUT = Gateway class
 * Goal: Test HTTP communication with Master Data API
 * Tool: Jest + axios-mock-adapter
 */

import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { MasterDataGateway } from '../../../src/gateways/masterDataGateway.js';

describe('Unit Test - MasterDataGateway', () => {
  let mock;
  let gateway;
  const baseUrl = 'http://localhost:5000';

  beforeEach(() => {
    mock = new MockAdapter(axios);
    gateway = new MasterDataGateway(baseUrl);
  });

  afterEach(() => {
    mock.restore();
  });

  describe('Constructor', () => {
    test('should initialize with base URL and no auth token', () => {
      const gateway = new MasterDataGateway(baseUrl);
      
      expect(gateway.client.defaults.baseURL).toBe(baseUrl);
      expect(gateway.client.defaults.headers['Content-Type']).toBe('application/json');
    });

    test('should initialize with auth token when provided', () => {
      const token = 'test-token-123';
      const gateway = new MasterDataGateway(baseUrl, token);
      
      expect(gateway.client.defaults.headers['Authorization']).toBe(`Bearer ${token}`);
    });

    test('should set timeout to 10 seconds', () => {
      const gateway = new MasterDataGateway(baseUrl);
      
      expect(gateway.client.defaults.timeout).toBe(10000);
    });
  });

  describe('setAuthToken', () => {
    test('should update authorization token', () => {
      const newToken = 'new-token-456';
      
      gateway.setAuthToken(newToken);
      
      expect(gateway.client.defaults.headers.common['Authorization']).toBe(`Bearer ${newToken}`);
    });
  });

  describe('getVvnAsync', () => {
    test('should return VVN data on successful request', async () => {
      const businessId = 'VVN-20260103-001';
      const vvnData = {
        businessId: 'VVN-20260103-001',
        vesselIdentifier: 'IMO1234567',
        estimatedArrivalTime: '2026-01-03T08:00:00Z'
      };

      mock.onGet(`/api/notifications/${businessId}`).reply(200, vvnData);

      const result = await gateway.getVvnAsync(businessId);

      expect(result).toEqual(vvnData);
    });

    test('should return null when VVN not found (404)', async () => {
      const businessId = 'VVN-NOTFOUND';

      mock.onGet(`/api/notifications/${businessId}`).reply(404);

      const result = await gateway.getVvnAsync(businessId);

      expect(result).toBeNull();
    });

    test('should return null on server error (500)', async () => {
      const businessId = 'VVN-ERROR';

      mock.onGet(`/api/notifications/${businessId}`).reply(500);

      const result = await gateway.getVvnAsync(businessId);

      expect(result).toBeNull();
    });

    test('should return null on network error', async () => {
      const businessId = 'VVN-NETWORK-ERROR';

      mock.onGet(`/api/notifications/${businessId}`).networkError();

      const result = await gateway.getVvnAsync(businessId);

      expect(result).toBeNull();
    });

    test('should return null on timeout', async () => {
      const businessId = 'VVN-TIMEOUT';

      mock.onGet(`/api/notifications/${businessId}`).timeout();

      const result = await gateway.getVvnAsync(businessId);

      expect(result).toBeNull();
    });
  });

  describe('getPendingVisitsAsync', () => {
    test('should return pending visits for a given date', async () => {
      const date = '2026-01-03';
      const pendingVisits = [
        {
          businessId: 'VVN-20260103-001',
          vesselIdentifier: 'IMO1234567',
          status: 'Submitted'
        },
        {
          businessId: 'VVN-20260103-002',
          vesselIdentifier: 'IMO7654321',
          status: 'Submitted'
        }
      ];

      mock.onGet(/\/api\/notifications\/search/).reply(200, pendingVisits);

      const result = await gateway.getPendingVisitsAsync(date);

      expect(result).toEqual(pendingVisits);
      expect(result).toHaveLength(2);
    });

    test('should construct correct URL with date range', async () => {
      const date = '2026-01-03';
      const expectedFromDate = '2026-01-03T00:00:00';
      const expectedToDate = '2026-01-03T23:59:59';

      let capturedUrl = '';
      mock.onGet(/\/api\/notifications\/search/).reply((config) => {
        capturedUrl = config.url;
        return [200, []];
      });

      await gateway.getPendingVisitsAsync(date);

      expect(capturedUrl).toContain('status=Submitted');
      expect(capturedUrl).toContain('from=');
      expect(capturedUrl).toContain('to=');
    });

    test('should return empty array when no pending visits found', async () => {
      const date = '2026-01-03';

      mock.onGet(/\/api\/notifications\/search/).reply(200, []);

      const result = await gateway.getPendingVisitsAsync(date);

      expect(result).toEqual([]);
    });

    test('should return empty array on server error', async () => {
      const date = '2026-01-03';

      mock.onGet(/\/api\/notifications\/search/).reply(500);

      const result = await gateway.getPendingVisitsAsync(date);

      expect(result).toEqual([]);
    });

    test('should return empty array on network error', async () => {
      const date = '2026-01-03';

      mock.onGet(/\/api\/notifications\/search/).networkError();

      const result = await gateway.getPendingVisitsAsync(date);

      expect(result).toEqual([]);
    });
  });

  describe('getStaffById', () => {
    test('should return staff member data on successful request', async () => {
      const staffId = 'STAFF-001';
      const staffData = {
        id: 'STAFF-001',
        shortName: 'John D.',
        email: 'john@example.com'
      };

      mock.onGet(`/api/StaffMembers/${staffId}`).reply(200, staffData);

      const result = await gateway.getStaffById(staffId);

      expect(result).toEqual(staffData);
    });

    test('should return null when staff member not found', async () => {
      const staffId = 'STAFF-NOTFOUND';

      mock.onGet(`/api/StaffMembers/${staffId}`).reply(404);

      const result = await gateway.getStaffById(staffId);

      expect(result).toBeNull();
    });

    test('should return null on server error', async () => {
      const staffId = 'STAFF-ERROR';

      mock.onGet(`/api/StaffMembers/${staffId}`).reply(500);

      const result = await gateway.getStaffById(staffId);

      expect(result).toBeNull();
    });

    test('should return null on network error', async () => {
      const staffId = 'STAFF-NETWORK-ERROR';

      mock.onGet(`/api/StaffMembers/${staffId}`).networkError();

      const result = await gateway.getStaffById(staffId);

      expect(result).toBeNull();
    });
  });

  describe('getAllStaff', () => {
    test('should return all staff members on successful request', async () => {
      const staffList = [
        {
          id: 'STAFF-001',
          shortName: 'John D.',
          email: 'john@example.com'
        },
        {
          id: 'STAFF-002',
          shortName: 'Jane S.',
          email: 'jane@example.com'
        }
      ];

      mock.onGet('/api/StaffMembers').reply(200, staffList);

      const result = await gateway.getAllStaff();

      expect(result).toEqual(staffList);
      expect(result).toHaveLength(2);
    });

    test('should return empty array when no staff members exist', async () => {
      mock.onGet('/api/StaffMembers').reply(200, []);

      const result = await gateway.getAllStaff();

      expect(result).toEqual([]);
    });

    test('should return empty array on server error', async () => {
      mock.onGet('/api/StaffMembers').reply(500);

      const result = await gateway.getAllStaff();

      expect(result).toEqual([]);
    });

    test('should return empty array on network error', async () => {
      mock.onGet('/api/StaffMembers').networkError();

      const result = await gateway.getAllStaff();

      expect(result).toEqual([]);
    });
  });

  describe('getAllResources', () => {
    test('should return all resources on successful request', async () => {
      const resourceList = [
        {
          code: 'RES-001',
          kind: 'Crane',
          description: 'Main Crane 1'
        },
        {
          code: 'RES-002',
          kind: 'Forklift',
          description: 'Forklift A'
        }
      ];

      mock.onGet('/api/Resource').reply(200, resourceList);

      const result = await gateway.getAllResources();

      expect(result).toEqual(resourceList);
      expect(result).toHaveLength(2);
    });

    test('should return empty array when no resources exist', async () => {
      mock.onGet('/api/Resource').reply(200, []);

      const result = await gateway.getAllResources();

      expect(result).toEqual([]);
    });

    test('should return empty array on server error', async () => {
      mock.onGet('/api/Resource').reply(500);

      const result = await gateway.getAllResources();

      expect(result).toEqual([]);
    });

    test('should return empty array on network error', async () => {
      mock.onGet('/api/Resource').networkError();

      const result = await gateway.getAllResources();

      expect(result).toEqual([]);
    });
  });

  describe('getResourceById', () => {
    test('should return resource data on successful request', async () => {
      const resourceId = 'RES-001';
      const resourceData = {
        code: 'RES-001',
        kind: 'Crane',
        description: 'Main Crane 1'
      };

      mock.onGet(`/api/Resource/${resourceId}`).reply(200, resourceData);

      const result = await gateway.getResourceById(resourceId);

      expect(result).toEqual(resourceData);
    });

    test('should return null when resource not found', async () => {
      const resourceId = 'RES-NOTFOUND';

      mock.onGet(`/api/Resource/${resourceId}`).reply(404);

      const result = await gateway.getResourceById(resourceId);

      expect(result).toBeNull();
    });

    test('should return null on server error', async () => {
      const resourceId = 'RES-ERROR';

      mock.onGet(`/api/Resource/${resourceId}`).reply(500);

      const result = await gateway.getResourceById(resourceId);

      expect(result).toBeNull();
    });

    test('should return null on network error', async () => {
      const resourceId = 'RES-NETWORK-ERROR';

      mock.onGet(`/api/Resource/${resourceId}`).networkError();

      const result = await gateway.getResourceById(resourceId);

      expect(result).toBeNull();
    });
  });

  describe('Authentication', () => {
    test('should include Authorization header when token is set', async () => {
      const token = 'test-token-123';
      const gateway = new MasterDataGateway(baseUrl, token);
      const staffId = 'STAFF-001';

      let capturedHeaders;
      mock.onGet(`/api/StaffMembers/${staffId}`).reply((config) => {
        capturedHeaders = config.headers;
        return [200, {}];
      });

      await gateway.getStaffById(staffId);

      expect(capturedHeaders['Authorization']).toBe(`Bearer ${token}`);
    });

    test('should update Authorization header after setAuthToken is called', () => {
      const initialToken = 'initial-token';
      const newToken = 'new-token';
      const testGateway = new MasterDataGateway(baseUrl, initialToken);
      
      testGateway.setAuthToken(newToken);

      // Verify the token was updated in the axios client instance
      expect(testGateway.client.defaults.headers.common['Authorization']).toBe(`Bearer ${newToken}`);
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed response gracefully', async () => {
      const businessId = 'VVN-MALFORMED';

      mock.onGet(`/api/notifications/${businessId}`).reply(200, 'invalid-json');

      const result = await gateway.getVvnAsync(businessId);

      // Since axios will parse it as a string, it should still return the data
      expect(result).toBeDefined();
    });

    test('should handle empty response body', async () => {
      const staffId = 'STAFF-EMPTY';

      mock.onGet(`/api/StaffMembers/${staffId}`).reply(200, null);

      const result = await gateway.getStaffById(staffId);

      expect(result).toBeNull();
    });
  });
});

