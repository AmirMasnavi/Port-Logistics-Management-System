/**
 * Unit Tests for IncidentMapper
 * 
 * Type: Functional Black-Box Testing with SUT = class
 * Goal: Test Mapper transformation logic in isolation
 * Tool: Jest
 */

import { IncidentMapper } from '../../../src/application/mappers/IncidentMapper.js';

describe('Unit Test - IncidentMapper', () => {
    
    describe('toDto', () => {
        test('should map all fields correctly from model', () => {
            const now = new Date();
            const model = {
                incidentId: '1',
                title: 'Title',
                incidentTypeId: 'Type1',
                severity: 'High',
                status: 'Open',
                startTime: now,
                endTime: null,
                durationMinutes: 0,
                affectedVves: ['V1'],
                description: 'Desc',
                createdBy: 'User',
                createdAt: now
            };

            const dto = IncidentMapper.toDto(model);

            expect(dto.incidentId).toBe('1');
            expect(dto.title).toBe('Title');
            expect(dto.incidentTypeId).toBe('Type1');
            expect(dto.severity).toBe('High');
            expect(dto.status).toBe('Open');
            expect(dto.startTime).toBe(now);
            expect(dto.affectedVves).toEqual(['V1']);
        });
    });

    describe('toListDto', () => {
        test('should map array of models', () => {
            const models = [
                { incidentId: '1', title: 'T1' },
                { incidentId: '2', title: 'T2' }
            ];
            const dtos = IncidentMapper.toListDto(models);
            expect(dtos).toHaveLength(2);
            expect(dtos[0].incidentId).toBe('1');
            expect(dtos[1].incidentId).toBe('2');
        });
    });
});

