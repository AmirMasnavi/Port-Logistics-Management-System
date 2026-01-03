/**
 * Unit Tests for ComplementaryTaskDto
 * 
 * Type: Functional Black-Box Testing with SUT = class
 * Goal: Test DTO instantiation and property assignment
 * Tool: Jest
 */

import { 
    CreateComplementaryTaskDto, 
    UpdateComplementaryTaskDto, 
    ComplementaryTaskFilterDto,
    ComplementaryTaskDto 
} from '../../../src/application/dtos/ComplementaryTaskDto.js';

describe('Unit Test - ComplementaryTaskDto', () => {
    
    describe('ComplementaryTaskDto', () => {
        test('should correctly assign all properties', () => {
            const startTime = new Date();
            const endTime = new Date(startTime.getTime() + 3600000);
            const createdAt = new Date();
            
            const dto = new ComplementaryTaskDto({
                taskId: 'CT-2026-001',
                categoryId: 'CAT-001',
                vveId: 'VVE-001',
                description: 'Safety inspection',
                responsibleTeam: 'Safety Team',
                startTime: startTime,
                endTime: endTime,
                status: 'COMPLETED',
                suspendsOperations: false,
                durationMinutes: 60,
                createdBy: 'User1',
                createdAt: createdAt,
                updatedBy: 'User2',
                updatedAt: createdAt
            });
            
            expect(dto.taskId).toBe('CT-2026-001');
            expect(dto.categoryId).toBe('CAT-001');
            expect(dto.vveId).toBe('VVE-001');
            expect(dto.description).toBe('Safety inspection');
            expect(dto.responsibleTeam).toBe('Safety Team');
            expect(dto.startTime).toBe(startTime);
            expect(dto.endTime).toBe(endTime);
            expect(dto.status).toBe('COMPLETED');
            expect(dto.suspendsOperations).toBe(false);
            expect(dto.durationMinutes).toBe(60);
            expect(dto.createdBy).toBe('User1');
        });
    });

    describe('CreateComplementaryTaskDto', () => {
        test('should correctly assign all required properties', () => {
            const startTime = new Date();
            const data = {
                categoryId: 'CAT-001',
                vveId: 'VVE-001',
                description: 'Hull inspection',
                responsibleTeam: 'Hull Crew',
                startTime: startTime,
                endTime: null,
                status: 'ONGOING',
                suspendsOperations: true
            };
            
            const dto = new CreateComplementaryTaskDto(data);
            
            expect(dto.categoryId).toBe('CAT-001');
            expect(dto.vveId).toBe('VVE-001');
            expect(dto.description).toBe('Hull inspection');
            expect(dto.responsibleTeam).toBe('Hull Crew');
            expect(dto.startTime).toBe(startTime);
            expect(dto.endTime).toBeNull();
            expect(dto.status).toBe('ONGOING');
            expect(dto.suspendsOperations).toBe(true);
        });

        test('should default description to empty string', () => {
            const data = {
                categoryId: 'CAT-001',
                vveId: 'VVE-001',
                responsibleTeam: 'Safety Team',
                startTime: new Date()
            };
            
            const dto = new CreateComplementaryTaskDto(data);
            expect(dto.description).toBe('');
        });

        test('should default status to PENDING', () => {
            const data = {
                categoryId: 'CAT-001',
                vveId: 'VVE-001',
                responsibleTeam: 'Safety Team',
                startTime: new Date()
            };
            
            const dto = new CreateComplementaryTaskDto(data);
            expect(dto.status).toBe('PENDING');
        });

        test('should default suspendsOperations to false', () => {
            const data = {
                categoryId: 'CAT-001',
                vveId: 'VVE-001',
                responsibleTeam: 'Safety Team',
                startTime: new Date()
            };
            
            const dto = new CreateComplementaryTaskDto(data);
            expect(dto.suspendsOperations).toBe(false);
        });

        test('should default endTime to null when not provided', () => {
            const data = {
                categoryId: 'CAT-001',
                vveId: 'VVE-001',
                responsibleTeam: 'Safety Team',
                startTime: new Date()
            };
            
            const dto = new CreateComplementaryTaskDto(data);
            expect(dto.endTime).toBeNull();
        });
    });

    describe('UpdateComplementaryTaskDto', () => {
        test('should only assign provided properties', () => {
            const dto = new UpdateComplementaryTaskDto({ 
                status: 'COMPLETED',
                responsibleTeam: 'New Team' 
            });
            
            expect(dto.status).toBe('COMPLETED');
            expect(dto.responsibleTeam).toBe('New Team');
            expect(dto.description).toBeUndefined();
            expect(dto.categoryId).toBeUndefined();
        });

        test('should update categoryId when provided', () => {
            const dto = new UpdateComplementaryTaskDto({ 
                categoryId: 'CAT-002' 
            });
            
            expect(dto.categoryId).toBe('CAT-002');
        });

        test('should update suspendsOperations when provided', () => {
            const dto = new UpdateComplementaryTaskDto({ 
                suspendsOperations: true 
            });
            
            expect(dto.suspendsOperations).toBe(true);
        });

        test('should update endTime when provided', () => {
            const endTime = new Date();
            const dto = new UpdateComplementaryTaskDto({ 
                endTime: endTime 
            });
            
            expect(dto.endTime).toBe(endTime);
        });

        test('should handle multiple property updates', () => {
            const startTime = new Date();
            const dto = new UpdateComplementaryTaskDto({ 
                status: 'ONGOING',
                startTime: startTime,
                description: 'Updated description'
            });
            
            expect(dto.status).toBe('ONGOING');
            expect(dto.startTime).toBe(startTime);
            expect(dto.description).toBe('Updated description');
        });
    });

    describe('ComplementaryTaskFilterDto', () => {
        test('should assign all filter properties when provided', () => {
            const startFrom = new Date();
            const startTo = new Date(startFrom.getTime() + 86400000);
            
            const data = {
                taskId: 'CT-2026-001',
                categoryId: 'CAT-001',
                vveId: 'VVE-001',
                status: 'ONGOING',
                suspendsOperations: true,
                responsibleTeam: 'Safety Team',
                startTimeFrom: startFrom,
                startTimeTo: startTo,
                endTimeFrom: startFrom,
                endTimeTo: startTo
            };
            
            const dto = new ComplementaryTaskFilterDto(data);
            
            expect(dto.taskId).toBe('CT-2026-001');
            expect(dto.categoryId).toBe('CAT-001');
            expect(dto.vveId).toBe('VVE-001');
            expect(dto.status).toBe('ONGOING');
            expect(dto.suspendsOperations).toBe(true);
            expect(dto.responsibleTeam).toBe('Safety Team');
            expect(dto.startTimeFrom).toBe(startFrom);
            expect(dto.startTimeTo).toBe(startTo);
        });

        test('should handle empty filter', () => {
            const dto = new ComplementaryTaskFilterDto();
            
            expect(dto.taskId).toBeUndefined();
            expect(dto.categoryId).toBeUndefined();
            expect(dto.status).toBeUndefined();
        });

        test('should handle partial filters', () => {
            const dto = new ComplementaryTaskFilterDto({ 
                vveId: 'VVE-001',
                status: 'COMPLETED'
            });
            
            expect(dto.vveId).toBe('VVE-001');
            expect(dto.status).toBe('COMPLETED');
            expect(dto.categoryId).toBeUndefined();
        });
    });
});

