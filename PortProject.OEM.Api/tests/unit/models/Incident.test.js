/**
 * Unit Tests for Incident Model
 * 
 * Type: Unit Testing
 * Goal: Test Mongoose Schema Validation
 * Tool: Jest + Mongoose
 */

import mongoose from 'mongoose';
import Incident from '../../../src/domain/models/Incident.js';

describe('Unit Test - Incident Model', () => {
    
    test('should validate a valid incident', () => {
        const incident = new Incident({
            incidentId: 'INC-001',
            title: 'Fire',
            incidentTypeId: 'T1',
            severity: 'Critical',
            startTime: new Date(),
            createdBy: 'User'
        });

        const error = incident.validateSync();
        expect(error).toBeUndefined();
    });

    test('should fail when required fields are missing', () => {
        const incident = new Incident({});
        const error = incident.validateSync();
        
        expect(error.errors.incidentId).toBeDefined();
        expect(error.errors.title).toBeDefined();
        expect(error.errors.incidentTypeId).toBeDefined();
        expect(error.errors.severity).toBeDefined();
        expect(error.errors.startTime).toBeDefined();
        expect(error.errors.createdBy).toBeDefined();
    });

    test('should fail when severity is invalid', () => {
        const incident = new Incident({
            incidentId: 'INC-001',
            title: 'Fire',
            incidentTypeId: 'T1',
            severity: 'Invalid',
            startTime: new Date(),
            createdBy: 'User'
        });

        const error = incident.validateSync();
        expect(error.errors.severity).toBeDefined();
    });

    test('should fail when status is invalid', () => {
        const incident = new Incident({
            incidentId: 'INC-001',
            title: 'Fire',
            incidentTypeId: 'T1',
            severity: 'Critical',
            status: 'Invalid',
            startTime: new Date(),
            createdBy: 'User'
        });

        const error = incident.validateSync();
        expect(error.errors.status).toBeDefined();
    });
});

