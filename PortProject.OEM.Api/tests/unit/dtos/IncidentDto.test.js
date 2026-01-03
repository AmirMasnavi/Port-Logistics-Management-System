/**
 * Unit Tests for IncidentDto
 * 
 * Type: Functional Black-Box Testing with SUT = class
 * Goal: Test DTO instantiation and property assignment
 * Tool: Jest
 */

import { IncidentDto, CreateIncidentDto, UpdateIncidentDto } from '../../../src/application/dtos/IncidentDto.js';

describe('Unit Test - IncidentDto', () => {
    
    describe('IncidentDto', () => {
        test('should correctly assign properties', () => {
            const now = new Date();
            const dto = new IncidentDto(
                '1', 'Title', 'Type1', 'High', 'Open', now, null, 0, [], 'Desc', 'User', now
            );
            
            expect(dto.incidentId).toBe('1');
            expect(dto.title).toBe('Title');
            expect(dto.incidentTypeId).toBe('Type1');
            expect(dto.severity).toBe('High');
            expect(dto.status).toBe('Open');
            expect(dto.startTime).toBe(now);
            expect(dto.affectedVves).toEqual([]);
        });
    });

    describe('CreateIncidentDto', () => {
        test('should correctly assign properties', () => {
            const now = new Date();
            const data = {
                title: 'Title',
                incidentTypeId: 'Type1',
                severity: 'High',
                startTime: now,
                description: 'Desc',
                affectedVves: ['V1']
            };
            const dto = new CreateIncidentDto(data);
            
            expect(dto.title).toBe('Title');
            expect(dto.incidentTypeId).toBe('Type1');
            expect(dto.severity).toBe('High');
            expect(dto.startTime).toBe(now);
            expect(dto.affectedVves).toEqual(['V1']);
        });

        test('should default affectedVves to empty array', () => {
            const data = {
                title: 'Title',
                incidentTypeId: 'Type1',
                severity: 'High',
                startTime: new Date(),
                description: 'Desc'
            };
            const dto = new CreateIncidentDto(data);
            expect(dto.affectedVves).toEqual([]);
        });
    });

    describe('UpdateIncidentDto', () => {
        test('should only assign provided properties', () => {
            const dto = new UpdateIncidentDto({ title: 'New Title' });
            expect(dto.title).toBe('New Title');
            expect(dto.description).toBeUndefined();
        });
    });
});

