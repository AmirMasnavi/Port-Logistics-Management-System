/**
 * Unit Tests for ComplementaryTaskMapper
 * 
 * Type: Functional Black-Box Testing with SUT = class
 * Goal: Test Mapper transformation logic in isolation
 * Tool: Jest
 */

import { ComplementaryTaskMapper } from '../../../src/application/mappers/ComplementaryTaskMapper.js';

describe('Unit Test - ComplementaryTaskMapper', () => {
    
    describe('toDto', () => {
        test('should map all fields correctly from model', () => {
            const startTime = new Date('2026-01-01T10:00:00Z');
            const endTime = new Date('2026-01-01T11:00:00Z');
            const createdAt = new Date('2026-01-01T09:00:00Z');
            
            const model = {
                taskId: 'CT-2026-001',
                categoryId: 'CAT-001',
                vveId: 'VVE-001',
                description: 'Safety inspection',
                responsibleTeam: 'Safety Team',
                startTime: startTime,
                endTime: endTime,
                status: 'COMPLETED',
                suspendsOperations: false,
                createdBy: 'User1',
                createdAt: createdAt,
                updatedBy: 'User2',
                updatedAt: createdAt
            };

            const dto = ComplementaryTaskMapper.toDto(model);

            expect(dto.taskId).toBe('CT-2026-001');
            expect(dto.categoryId).toBe('CAT-001');
            expect(dto.vveId).toBe('VVE-001');
            expect(dto.description).toBe('Safety inspection');
            expect(dto.responsibleTeam).toBe('Safety Team');
            expect(dto.startTime).toBe(startTime);
            expect(dto.endTime).toBe(endTime);
            expect(dto.status).toBe('COMPLETED');
            expect(dto.suspendsOperations).toBe(false);
            expect(dto.durationMinutes).toBe(60); // 1 hour difference
            expect(dto.createdBy).toBe('User1');
            expect(dto.updatedBy).toBe('User2');
        });

        test('should calculate duration correctly when endTime is present', () => {
            const startTime = new Date('2026-01-01T10:00:00Z');
            const endTime = new Date('2026-01-01T12:30:00Z'); // 2.5 hours later
            
            const model = {
                taskId: 'CT-2026-001',
                categoryId: 'CAT-001',
                vveId: 'VVE-001',
                responsibleTeam: 'Safety Team',
                startTime: startTime,
                endTime: endTime,
                status: 'COMPLETED',
                suspendsOperations: false,
                createdBy: 'User1',
                createdAt: new Date()
            };

            const dto = ComplementaryTaskMapper.toDto(model);

            expect(dto.durationMinutes).toBe(150); // 2.5 hours = 150 minutes
        });

        test('should return null duration when endTime is not present', () => {
            const model = {
                taskId: 'CT-2026-001',
                categoryId: 'CAT-001',
                vveId: 'VVE-001',
                responsibleTeam: 'Safety Team',
                startTime: new Date(),
                endTime: null,
                status: 'ONGOING',
                suspendsOperations: false,
                createdBy: 'User1',
                createdAt: new Date()
            };

            const dto = ComplementaryTaskMapper.toDto(model);

            expect(dto.durationMinutes).toBeNull();
        });

        test('should handle task that suspends operations', () => {
            const model = {
                taskId: 'CT-2026-001',
                categoryId: 'CAT-002',
                vveId: 'VVE-001',
                description: 'Emergency maintenance',
                responsibleTeam: 'Maintenance Crew',
                startTime: new Date(),
                endTime: null,
                status: 'ONGOING',
                suspendsOperations: true,
                createdBy: 'User1',
                createdAt: new Date()
            };

            const dto = ComplementaryTaskMapper.toDto(model);

            expect(dto.suspendsOperations).toBe(true);
        });

        test('should return null when model is null', () => {
            const dto = ComplementaryTaskMapper.toDto(null);
            expect(dto).toBeNull();
        });

        test('should return null when model is undefined', () => {
            const dto = ComplementaryTaskMapper.toDto(undefined);
            expect(dto).toBeNull();
        });
    });

    describe('toListDto', () => {
        test('should map array of models correctly', () => {
            const startTime1 = new Date('2026-01-01T10:00:00Z');
            const startTime2 = new Date('2026-01-01T14:00:00Z');
            
            const models = [
                {
                    taskId: 'CT-2026-001',
                    categoryId: 'CAT-001',
                    vveId: 'VVE-001',
                    responsibleTeam: 'Safety Team',
                    startTime: startTime1,
                    status: 'COMPLETED',
                    suspendsOperations: false,
                    createdBy: 'User1',
                    createdAt: new Date()
                },
                {
                    taskId: 'CT-2026-002',
                    categoryId: 'CAT-002',
                    vveId: 'VVE-002',
                    responsibleTeam: 'Hull Crew',
                    startTime: startTime2,
                    status: 'ONGOING',
                    suspendsOperations: true,
                    createdBy: 'User2',
                    createdAt: new Date()
                }
            ];
            
            const dtos = ComplementaryTaskMapper.toListDto(models);
            
            expect(dtos).toHaveLength(2);
            expect(dtos[0].taskId).toBe('CT-2026-001');
            expect(dtos[0].status).toBe('COMPLETED');
            expect(dtos[1].taskId).toBe('CT-2026-002');
            expect(dtos[1].status).toBe('ONGOING');
            expect(dtos[1].suspendsOperations).toBe(true);
        });

        test('should return empty array when models is null', () => {
            const dtos = ComplementaryTaskMapper.toListDto(null);
            expect(dtos).toEqual([]);
        });

        test('should return empty array when models is undefined', () => {
            const dtos = ComplementaryTaskMapper.toListDto(undefined);
            expect(dtos).toEqual([]);
        });

        test('should return empty array when models is not an array', () => {
            const dtos = ComplementaryTaskMapper.toListDto({});
            expect(dtos).toEqual([]);
        });

        test('should handle empty array', () => {
            const dtos = ComplementaryTaskMapper.toListDto([]);
            expect(dtos).toEqual([]);
        });
    });

    describe('toDomain', () => {
        test('should map all fields from DTO to domain data', () => {
            const startTime = new Date();
            const endTime = new Date();
            
            const dto = {
                categoryId: 'CAT-001',
                vveId: 'VVE-001',
                description: 'Hull inspection',
                responsibleTeam: 'Hull Crew',
                startTime: startTime,
                endTime: endTime,
                status: 'ONGOING',
                suspendsOperations: true
            };

            const domain = ComplementaryTaskMapper.toDomain(dto);

            expect(domain.categoryId).toBe('CAT-001');
            expect(domain.vveId).toBe('VVE-001');
            expect(domain.description).toBe('Hull inspection');
            expect(domain.responsibleTeam).toBe('Hull Crew');
            expect(domain.startTime).toBe(startTime);
            expect(domain.endTime).toBe(endTime);
            expect(domain.status).toBe('ONGOING');
            expect(domain.suspendsOperations).toBe(true);
        });

        test('should default description to empty string when not provided', () => {
            const dto = {
                categoryId: 'CAT-001',
                vveId: 'VVE-001',
                responsibleTeam: 'Safety Team',
                startTime: new Date()
            };

            const domain = ComplementaryTaskMapper.toDomain(dto);

            expect(domain.description).toBe('');
        });

        test('should default status to PENDING when not provided', () => {
            const dto = {
                categoryId: 'CAT-001',
                vveId: 'VVE-001',
                responsibleTeam: 'Safety Team',
                startTime: new Date()
            };

            const domain = ComplementaryTaskMapper.toDomain(dto);

            expect(domain.status).toBe('PENDING');
        });

        test('should default suspendsOperations to false when not provided', () => {
            const dto = {
                categoryId: 'CAT-001',
                vveId: 'VVE-001',
                responsibleTeam: 'Safety Team',
                startTime: new Date()
            };

            const domain = ComplementaryTaskMapper.toDomain(dto);

            expect(domain.suspendsOperations).toBe(false);
        });

        test('should default endTime to null when not provided', () => {
            const dto = {
                categoryId: 'CAT-001',
                vveId: 'VVE-001',
                responsibleTeam: 'Safety Team',
                startTime: new Date()
            };

            const domain = ComplementaryTaskMapper.toDomain(dto);

            expect(domain.endTime).toBeNull();
        });
    });
});

