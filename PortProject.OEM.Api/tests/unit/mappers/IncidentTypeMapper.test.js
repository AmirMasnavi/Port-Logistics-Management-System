/**
 * Unit Tests for IncidentTypeMapper
 * 
 * Type: Functional Black-Box Testing with SUT = class
 * Goal: Test Mapper transformation logic in isolation
 * Tool: Jest
 */

import { IncidentTypeMapper } from '../../../src/application/mappers/IncidentTypeMapper.js';

describe('Unit Test - IncidentTypeMapper', () => {
    
    describe('toResponseDto', () => {
        test('should map all fields correctly', () => {
            const model = {
                id: '1',
                code: 'C1',
                name: 'N1',
                description: 'D1',
                severity: 'Minor',
                parentId: 'P1',
                parent: { code: 'PC1', name: 'PN1' },
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const dto = IncidentTypeMapper.toResponseDto(model);

            expect(dto.id).toBe('1');
            expect(dto.code).toBe('C1');
            expect(dto.parentCode).toBe('PC1');
            expect(dto.parentName).toBe('PN1');
        });
    });

    describe('toListItemDto', () => {
        test('should map to list item dto', () => {
            const model = {
                id: '1',
                code: 'C1',
                name: 'N1',
                description: 'D1',
                severity: 'Minor',
                parentId: 'P1',
                parent: { name: 'PN1' },
                createdAt: new Date()
            };

            const dto = IncidentTypeMapper.toListItemDto(model);

            expect(dto.id).toBe('1');
            expect(dto.code).toBe('C1');
            expect(dto.parentId).toBe('P1');
            expect(dto.description).toBe('D1');
        });
    });

    describe('toTreeDto', () => {
        test('should build tree structure', () => {
            const models = [
                { id: '1', parentId: null, code: 'Root' },
                { id: '2', parentId: '1', code: 'Child' }
            ];

            const tree = IncidentTypeMapper.toTreeDto(models);

            expect(tree).toHaveLength(1);
            expect(tree[0].id).toBe('1');
            expect(tree[0].children).toHaveLength(1);
            expect(tree[0].children[0].id).toBe('2');
        });
    });
});

