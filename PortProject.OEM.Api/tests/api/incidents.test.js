/**
 * API Tests for Incidents Endpoints
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
const { createIncidentRouter } = await import('../../src/controllers/incidentController.js');
const { createIncidentTypeRouter } = await import('../../src/controllers/incidentTypeController.js');

const createApp = () => {
    const app = express();
    app.use(express.json());
    app.use('/api/incidents', createIncidentRouter());
    app.use('/api/incident-types', createIncidentTypeRouter());
    return app;
};

describe('API Tests - Incidents', () => {
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

    describe('POST /api/incidents', () => {
        test('should create a new incident', async () => {
            // First create a type
            const typeRes = await request(app)
                .post('/api/incident-types')
                .send({
                    code: 'T1',
                    name: 'Type 1',
                    severity: 'Critical'
                });
            
            console.log('Type Response:', JSON.stringify(typeRes.body, null, 2));
            const typeId = typeRes.body.data.id;

            const res = await request(app)
                .post('/api/incidents')
                .send({
                    title: 'Incident 1',
                    incidentTypeId: typeId,
                    severity: 'Critical',
                    startTime: new Date().toISOString(),
                    description: 'Desc'
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.title).toBe('Incident 1');
        });

        test('should fail if type does not exist', async () => {
            const res = await request(app)
                .post('/api/incidents')
                .send({
                    title: 'Incident 1',
                    incidentTypeId: 'NON_EXISTENT',
                    severity: 'Critical',
                    startTime: new Date().toISOString()
                });

            expect(res.status).toBe(500); // Service throws error, controller catches and returns 500
        });
    });

    describe('GET /api/incidents', () => {
        test('should return all incidents', async () => {
            // Create type
            const typeRes = await request(app)
                .post('/api/incident-types')
                .send({ code: 'T1', name: 'Type 1', severity: 'Critical' });
            
            const typeId = typeRes.body.data.id;

            // Create incident
            await request(app)
                .post('/api/incidents')
                .send({
                    title: 'Incident 1',
                    incidentTypeId: typeId,
                    severity: 'Critical',
                    startTime: new Date().toISOString()
                });

            const res = await request(app)
                .get('/api/incidents');

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
        });
    });
});

