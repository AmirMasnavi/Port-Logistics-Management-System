import { Router } from 'express';
import mongoose from 'mongoose';
import { verifyFirebaseToken } from '../config/firebase.js';
import { isDatabaseConnected } from '../config/database.js';

/**
 * OEM Test Controller - Unified
 * Contains all test endpoints for connectivity, authentication, gateway communication, and database operations
 * 
 * @swagger
 * tags:
 *   name: OEM Test
 *   description: Test endpoints for OEM API functionality
 */
export const createOemTestRouter = (masterDataGateway) => {
  const router = Router();

  /**
   * @swagger
   * /api/oem/ping:
   *   get:
   *     summary: Server health check
   *     description: Test if the OEM API server is running
   *     tags: [OEM Test]
   *     responses:
   *       200:
   *         description: Server is running
   */
  router.get('/ping', (req, res) => {
    res.json({
      message: 'OEM Kitchen is Open!',
      time: new Date().toISOString(),
    });
  });

  /**
   * @swagger
   * /api/oem/secure:
   *   get:
   *     summary: Test Firebase authentication
   *     description: Verify Firebase JWT token validation works
   *     tags: [OEM Test]
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: Authentication successful
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   */
  router.get('/secure', verifyFirebaseToken, (req, res) => {
    const userEmail = req.user?.email || 'Unknown';
    
    res.json({
      message: `Secure access granted for: ${userEmail}`,
    });
  });

  /**
   * @swagger
   * /api/oem/check-vvn/{id}:
   *   get:
   *     summary: Test gateway communication
   *     description: Test communication with Master Data API
   *     tags: [OEM Test]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: VVN business ID
   *     responses:
   *       200:
   *         description: Communication successful
   *       404:
   *         description: VVN not found
   */
  router.get('/check-vvn/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      console.log(`[CHECK-VVN] Attempting to fetch VVN with ID: ${id}`);
      console.log(`[CHECK-VVN] Master Data API URL: ${process.env.MASTER_DATA_API_URL}`);
      console.log(`[CHECK-VVN] Full URL will be: ${process.env.MASTER_DATA_API_URL}/api/notifications/${id}`);
      
      const vvn = await masterDataGateway.getVvnAsync(id);
      
      if (!vvn) {
        return res.status(404).json({
          success: false,
          message: `Could not find VVN '${id}' in the Master Data system.`,
          possibleReasons: [
            'The Master Data API (PortProject.Api) might not be running on ' + process.env.MASTER_DATA_API_URL,
            'The VVN with this ID does not exist in the Master Data database',
            'The Master Data API endpoint might require authentication',
            'Check if you can access: ' + process.env.MASTER_DATA_API_URL + '/api/notifications/' + id + ' directly in your browser'
          ],
          troubleshooting: {
            step1: 'Verify Master Data API is running: curl ' + process.env.MASTER_DATA_API_URL + '/health',
            step2: 'Test VVN endpoint directly: curl ' + process.env.MASTER_DATA_API_URL + '/api/notifications/' + id,
            step3: 'Check server console logs for detailed error messages'
          }
        });
      }

      console.log(`[CHECK-VVN] ✅ Successfully retrieved VVN data`);
      res.json({
        success: true,
        message: '✅ Gateway Communication Successful!',
        dataFromMasterDataAPI: vvn,
        note: 'This data came from the Master Data API via REST (no direct database access)'
      });
    } catch (error) {
      console.error('[check-vvn] Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: error.message,
        details: error.response?.data || 'No additional details'
      });
    }
  });

  /**
   * @swagger
   * /api/oem/check-db:
   *   get:
   *     summary: Check database connection
   *     description: Verify MongoDB connection status
   *     tags: [OEM Test]
   *     responses:
   *       200:
   *         description: Database connected
   *       500:
   *         description: Database connection failed
   */
  router.get('/check-db', async (req, res) => {
    try {
      console.log('[DB TEST] Attempting to check connection...');
      
      const canConnect = isDatabaseConnected();
      
      if (canConnect) {
        return res.json({
          status: 'Success',
          message: '✅ Connected to portsystem_oem!',
        });
      } else {
        return res.status(500).json({
          status: 'Failed',
          message: '❌ Database is not connected. Check your connection string.',
        });
      }
    } catch (error) {
      return res.status(500).json({
        status: 'Error',
        message: `❌ Exception: ${error.message}`,
        details: error.stack,
      });
    }
  });

  /**
   * @swagger
   * /api/oem/create-db:
   *   post:
   *     summary: Initialize database with test data
   *     description: Creates the database by inserting a test document (MongoDB uses lazy creation)
   *     tags: [OEM Test]
   *     responses:
   *       200:
   *         description: Database created successfully
   *       500:
   *         description: Failed to create database
   */
  router.post('/create-db', async (req, res) => {
    try {
      console.log('[DB CREATE] Creating database with test data...');
      
      // Get the database connection
      const db = mongoose.connection.db;
      
      if (!db) {
        return res.status(500).json({
          success: false,
          message: '❌ Database connection not available'
        });
      }
      
      // Create a test collection and insert a document - THIS creates the database
      const collection = db.collection('test_initialization');
      
      const testDocument = {
        message: 'Database initialized successfully',
        timestamp: new Date(),
        createdBy: 'oemTestController',
        purpose: 'Initial database creation - MongoDB uses lazy creation'
      };
      
      const result = await collection.insertOne(testDocument);
      
      console.log('[DB CREATE] ✅ Database created successfully!');
      
      res.json({
        success: true,
        message: '✅ Database and collection created successfully! Refresh IntelliJ MongoDB connection.',
        database: 'portsystem_oem',
        collection: 'test_initialization',
        insertedId: result.insertedId.toString()
      });
      
    } catch (error) {
      console.error('[DB CREATE] Error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: '❌ Failed to create database'
      });
    }
  });

  /**
   * @swagger
   * /api/oem/db-status:
   *   get:
   *     summary: Get database status
   *     description: Check database connection and list all collections
   *     tags: [OEM Test]
   *     responses:
   *       200:
   *         description: Database status retrieved
   */
  router.get('/db-status', async (req, res) => {
    try {
      const db = mongoose.connection.db;
      
      if (!db) {
        return res.json({
          success: false,
          message: 'Database not connected'
        });
      }
      
      const collections = await db.listCollections().toArray();
      
      res.json({
        success: true,
        database: 'portsystem_oem',
        connected: mongoose.connection.readyState === 1,
        collections: collections.map(c => c.name),
        collectionsCount: collections.length
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * @swagger
   * /api/oem/test-master-data-connection:
   *   get:
   *     summary: Test Master Data API connectivity
   *     description: Check if the Master Data API is reachable and responding
   *     tags: [OEM Test]
   *     responses:
   *       200:
   *         description: Master Data API is reachable
   *       500:
   *         description: Cannot connect to Master Data API
   */
  router.get('/test-master-data-connection', async (req, res) => {
    try {
      const masterDataUrl = process.env.MASTER_DATA_API_URL || 'http://localhost:5273';
      
      console.log(`[TEST CONNECTION] Testing connection to Master Data API at: ${masterDataUrl}`);
      
      // Try to ping the Master Data API endpoints
      const axios = (await import('axios')).default;
      const testUrls = [
        `${masterDataUrl}/swagger/index.html`, // Swagger UI endpoint
        `${masterDataUrl}/api/vessels`, // Vessels endpoint (should exist)
        `${masterDataUrl}/api/docks`, // Docks endpoint (should exist)
      ];
      
      const results = [];
      
      for (const url of testUrls) {
        try {
          const response = await axios.get(url, { 
            timeout: 5000,
            validateStatus: (status) => status < 500 // Accept 2xx, 3xx, 4xx as "reachable"
          });
          results.push({
            url,
            status: 'SUCCESS',
            statusCode: response.status,
            message: response.status === 401 || response.status === 405 
              ? 'Endpoint exists but requires authentication (this is OK)' 
              : 'Endpoint is reachable'
          });
        } catch (error) {
          // Even if we get auth errors, the server is reachable
          if (error.response && (error.response.status === 401 || error.response.status === 405)) {
            results.push({
              url,
              status: 'SUCCESS',
              statusCode: error.response.status,
              message: 'Endpoint exists but requires authentication (this is OK - server is running!)'
            });
          } else {
            results.push({
              url,
              status: 'FAILED',
              statusCode: error.response?.status || 'N/A',
              error: error.code || error.message
            });
          }
        }
      }
      
      const anySuccess = results.some(r => r.status === 'SUCCESS');
      
      res.json({
        success: anySuccess,
        message: anySuccess 
          ? '✅ Master Data API is reachable and running!' 
          : '❌ Cannot connect to Master Data API',
        masterDataApiUrl: masterDataUrl,
        connectionTests: results,
        recommendation: anySuccess
          ? `Gateway communication is working! The Master Data API is running on ${masterDataUrl}. If VVN lookup fails, check: 1) The VVN ID exists in the database, 2) The endpoint doesn't require authentication.`
          : `Master Data API is NOT running or not accessible. Start PortProject.Api: cd PortProject.Api && dotnet run`
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  return router;
};

