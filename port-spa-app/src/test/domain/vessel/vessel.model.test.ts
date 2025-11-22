import { describe, it, expect } from 'vitest';
import type { Vessel } from '../../../domain/vessel/vessel.model';

describe('Vessel Domain Model', () => {
    describe('Vessel interface', () => {
        it('should accept a valid vessel object', () => {
            const vessel: Vessel = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                imoNumber: 'IMO1234567',
                name: 'Cargo Ship Alpha',
                operator: 'Maritime Transport Co.',
                vesselTypeId: 'vessel-type-123',
                createdAt: '2024-01-15T10:30:00Z'
            };

            expect(vessel.id).toBe('123e4567-e89b-12d3-a456-426614174000');
            expect(vessel.imoNumber).toBe('IMO1234567');
            expect(vessel.name).toBe('Cargo Ship Alpha');
            expect(vessel.operator).toBe('Maritime Transport Co.');
            expect(vessel.vesselTypeId).toBe('vessel-type-123');
            expect(vessel.createdAt).toBe('2024-01-15T10:30:00Z');
        });

        it('should accept vessel with different valid values', () => {
            const vessel: Vessel = {
                id: 'vessel-001',
                imoNumber: 'IMO9876543',
                name: 'Container Vessel Beta',
                operator: 'Global Shipping Lines',
                vesselTypeId: 'type-456',
                createdAt: '2024-03-20T14:45:30Z'
            };

            expect(vessel).toBeDefined();
            expect(vessel.id).toBe('vessel-001');
            expect(vessel.imoNumber).toBe('IMO9876543');
            expect(vessel.name).toBe('Container Vessel Beta');
        });

        it('should have all required properties', () => {
            const vessel: Vessel = {
                id: 'test-id',
                imoNumber: 'IMO1111111',
                name: 'Test Vessel',
                operator: 'Test Operator',
                vesselTypeId: 'test-type-id',
                createdAt: '2024-01-01T00:00:00Z'
            };

            expect(vessel).toHaveProperty('id');
            expect(vessel).toHaveProperty('imoNumber');
            expect(vessel).toHaveProperty('name');
            expect(vessel).toHaveProperty('operator');
            expect(vessel).toHaveProperty('vesselTypeId');
            expect(vessel).toHaveProperty('createdAt');
        });

        it('should accept vessel with UUID format id', () => {
            const vessel: Vessel = {
                id: '550e8400-e29b-41d4-a716-446655440000',
                imoNumber: 'IMO2222222',
                name: 'UUID Vessel',
                operator: 'UUID Operator',
                vesselTypeId: '660e8400-e29b-41d4-a716-446655440000',
                createdAt: '2024-02-10T08:15:00Z'
            };

            expect(vessel.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
            expect(vessel.vesselTypeId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        });

        it('should accept vessel with ISO 8601 date format', () => {
            const vessel: Vessel = {
                id: 'vessel-date-test',
                imoNumber: 'IMO3333333',
                name: 'Date Test Vessel',
                operator: 'Date Test Operator',
                vesselTypeId: 'type-date-test',
                createdAt: '2024-06-15T12:00:00.000Z'
            };

            expect(vessel.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
            expect(new Date(vessel.createdAt).toString()).not.toBe('Invalid Date');
        });

        it('should accept vessel with special characters in name', () => {
            const vessel: Vessel = {
                id: 'special-vessel',
                imoNumber: 'IMO4444444',
                name: 'Vessel "Special" & Characters - Test',
                operator: "O'Brien Maritime Ltd.",
                vesselTypeId: 'type-special',
                createdAt: '2024-04-10T16:30:00Z'
            };

            expect(vessel.name).toContain('"Special"');
            expect(vessel.operator).toContain("O'Brien");
        });

        it('should maintain property types', () => {
            const vessel: Vessel = {
                id: 'type-check-vessel',
                imoNumber: 'IMO5555555',
                name: 'Type Check Vessel',
                operator: 'Type Check Operator',
                vesselTypeId: 'type-check-id',
                createdAt: '2024-05-01T09:00:00Z'
            };

            expect(typeof vessel.id).toBe('string');
            expect(typeof vessel.imoNumber).toBe('string');
            expect(typeof vessel.name).toBe('string');
            expect(typeof vessel.operator).toBe('string');
            expect(typeof vessel.vesselTypeId).toBe('string');
            expect(typeof vessel.createdAt).toBe('string');
        });

        it('should create multiple distinct vessel instances', () => {
            const vessel1: Vessel = {
                id: 'vessel-1',
                imoNumber: 'IMO1111111',
                name: 'First Vessel',
                operator: 'First Operator',
                vesselTypeId: 'type-1',
                createdAt: '2024-01-01T00:00:00Z'
            };

            const vessel2: Vessel = {
                id: 'vessel-2',
                imoNumber: 'IMO2222222',
                name: 'Second Vessel',
                operator: 'Second Operator',
                vesselTypeId: 'type-2',
                createdAt: '2024-01-02T00:00:00Z'
            };

            expect(vessel1.id).not.toBe(vessel2.id);
            expect(vessel1.imoNumber).not.toBe(vessel2.imoNumber);
            expect(vessel1.name).not.toBe(vessel2.name);
        });
    });
});
