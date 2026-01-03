/**
 * API Tests for Incident Types Endpoints
 * 
 * Type: Functional Testing with SUT = application
 * Goal: Test HTTP Endpoints with real database (in-memory)
 * Tool: supertest + mongodb-memory-server
 */

import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import express from 'express';
import { jest } from '@jest/globals';

// Use unstable_mockModule for ESM mocking
jest.unstable_mockModule('../../src/config/firebase.js', () => ({
    verifyFirebaseToken: (req, res, next) => {
        req.user = { uid: 'test', email: 'test@test.com' };
        next();
    }
}));

// Dynamic import after mock
const { createIncidentTypeRouter } = await import('../../src/controllers/incidentTypeController.js');

const createApp = () => {
    const app = express();
    app.use(express.json());
    app.use('/api/incident-types', createIncidentTypeRouter());
    return app;
};

describe('API Tests - Incident Types', () => {
    let mongoServer;
    let app;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);
        app = createApp();
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    afterEach(async () => {
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            await collections[key].deleteMany({});
        }
    });

    describe('POST /api/incident-types', () => {
        test('should create a new incident type', async () => {
            const res = await request(app)
                .post('/api/incident-types')
                .send({
                    code: 'INC-001',
                    name: 'Fire',
                    severity: 'Critical',
                    description: 'Fire incident'
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.code).toBe('INC-001');
        });

        test('should fail validation', async () => {
            const res = await request(app)
                .post('/api/incident-types')
                .send({
                    name: 'Fire'
                    // Missing required fields: code, severity, description
                });

            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/incident-types', () => {
        test('should return all types', async () => {
            // Create one first
            const createRes = await request(app)
                .post('/api/incident-types')
                .send({
                    code: 'INC-001',
                    name: 'Fire',
                    severity: 'Critical',
                    description: 'Fire incident type'
                });
            
            expect(createRes.status).toBe(201);

            const res = await request(app)
                .get('/api/incident-types');

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
        });
    });
});

