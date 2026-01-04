/**
 * Unit Tests for ComplementaryTaskCategoriesMapper
 * 
 * Type: Functional Black-Box Testing with SUT = class
 * Goal: Test Mapper transformation logic in isolation
 * Tool: Jest
 */

import { ComplementaryTaskCategoryMapper } from '../../../src/application/mappers/ComplementaryTaskCategoriesMapper.js';

describe('Unit Test - ComplementaryTaskCategoriesMapper', () => {
    
    describe('toDto', () => {
        test('should map all fields correctly from model', () => {
            const createdAt = new Date('2025-01-01T09:00:00Z');
            
            const model = {
                categoryId: 'CTC-2025-001',
                code: 'CTC001',
                name: 'Security Check',
                description: 'Pre-departure security inspection',
                defaultDurationMinutes: 30,
                expectedImpactMinutes: 45,
                isActive: true,
                createdAt: createdAt,
                group: 'Safety and Security'
            };

            const dto = ComplementaryTaskCategoryMapper.toDto(model);

            expect(dto.categoryId).toBe('CTC-2025-001');
            expect(dto.code).toBe('CTC001');
            expect(dto.name).toBe('Security Check');
            expect(dto.description).toBe('Pre-departure security inspection');
            expect(dto.defaultDurationMinutes).toBe(30);
            expect(dto.expectedImpactMinutes).toBe(45);
            expect(dto.isActive).toBe(true);
            expect(dto.createdAt).toBe(createdAt);
            expect(dto.group).toBe('Safety and Security');
        });

        test('should handle model with id field instead of categoryId', () => {
            const model = {
                id: 'CTC-2025-002',
                code: 'CTC002',
                name: 'Maintenance Task',
                description: 'Routine maintenance',
                defaultDurationMinutes: 60,
                expectedImpactMinutes: 75,
                isActive: true,
                createdAt: new Date(),
                group: 'Maintenance'
            };

            const dto = ComplementaryTaskCategoryMapper.toDto(model);

            expect(dto.categoryId).toBe('CTC-2025-002');
            expect(dto.code).toBe('CTC002');
            expect(dto.name).toBe('Maintenance Task');
        });

        test('should default null duration fields', () => {
            const model = {
                categoryId: 'CTC-2025-003',
                code: 'CTC003',
                name: 'Cleaning Task',
                description: 'General cleaning',
                defaultDurationMinutes: null,
                expectedImpactMinutes: null,
                isActive: true,
                createdAt: new Date(),
                group: 'Cleaning and Housekeeping'
            };

            const dto = ComplementaryTaskCategoryMapper.toDto(model);

            expect(dto.defaultDurationMinutes).toBeNull();
            expect(dto.expectedImpactMinutes).toBeNull();
        });

        test('should default isActive to true when not present', () => {
            const model = {
                categoryId: 'CTC-2025-004',
                code: 'CTC004',
                name: 'Crew Change',
                description: 'Crew boarding/disembarking',
                createdAt: new Date(),
                group: 'Crew and Personnel'
            };

            const dto = ComplementaryTaskCategoryMapper.toDto(model);

            expect(dto.isActive).toBe(true);
        });

        test('should handle inactive category', () => {
            const model = {
                categoryId: 'CTC-2025-005',
                code: 'CTC005',
                name: 'Deprecated Task',
                description: 'No longer used',
                defaultDurationMinutes: 15,
                expectedImpactMinutes: 20,
                isActive: false,
                createdAt: new Date(),
                group: 'Other'
            };

            const dto = ComplementaryTaskCategoryMapper.toDto(model);

            expect(dto.isActive).toBe(false);
        });

        test('should handle all valid group types', () => {
            const validGroups = [
                'Safety and Security',
                'Maintenance',
                'Cleaning and Housekeeping',
                'Bunkering and Supply',
                'Crew and Personnel',
                'Regulatory and Surveys',
                'Weather and External Delays',
                'Other'
            ];

            validGroups.forEach((group, index) => {
                const model = {
                    categoryId: `CTC-2025-${index + 100}`,
                    code: `CTC${index + 100}`,
                    name: `Category ${index}`,
                    description: `Description ${index}`,
                    defaultDurationMinutes: 30,
                    expectedImpactMinutes: 45,
                    isActive: true,
                    createdAt: new Date(),
                    group: group
                };

                const dto = ComplementaryTaskCategoryMapper.toDto(model);
                expect(dto.group).toBe(group);
            });
        });

        test('should handle empty description', () => {
            const model = {
                categoryId: 'CTC-2025-006',
                code: 'CTC006',
                name: 'Simple Task',
                description: '',
                defaultDurationMinutes: 10,
                expectedImpactMinutes: 15,
                isActive: true,
                createdAt: new Date(),
                group: 'Other'
            };

            const dto = ComplementaryTaskCategoryMapper.toDto(model);

            expect(dto.description).toBe('');
        });

        test('should handle model with zero duration values', () => {
            const model = {
                categoryId: 'CTC-2025-007',
                code: 'CTC007',
                name: 'Instant Task',
                description: 'No duration task',
                defaultDurationMinutes: 0,
                expectedImpactMinutes: 0,
                isActive: true,
                createdAt: new Date(),
                group: 'Other'
            };

            const dto = ComplementaryTaskCategoryMapper.toDto(model);

            expect(dto.defaultDurationMinutes).toBe(0);
            expect(dto.expectedImpactMinutes).toBe(0);
        });

        test('should handle large duration values', () => {
            const model = {
                categoryId: 'CTC-2025-008',
                code: 'CTC008',
                name: 'Extended Task',
                description: 'Long duration task',
                defaultDurationMinutes: 1440, // 24 hours
                expectedImpactMinutes: 2880, // 48 hours
                isActive: true,
                createdAt: new Date(),
                group: 'Maintenance'
            };

            const dto = ComplementaryTaskCategoryMapper.toDto(model);

            expect(dto.defaultDurationMinutes).toBe(1440);
            expect(dto.expectedImpactMinutes).toBe(2880);
        });
    });

    describe('toListDto', () => {
        test('should map array of models correctly', () => {
            const createdAt1 = new Date('2025-01-01T09:00:00Z');
            const createdAt2 = new Date('2025-01-02T09:00:00Z');
            
            const models = [
                {
                    categoryId: 'CTC-2025-001',
                    code: 'CTC001',
                    name: 'Security Check',
                    description: 'Pre-departure security',
                    defaultDurationMinutes: 30,
                    expectedImpactMinutes: 45,
                    isActive: true,
                    createdAt: createdAt1,
                    group: 'Safety and Security'
                },
                {
                    categoryId: 'CTC-2025-002',
                    code: 'CTC002',
                    name: 'Maintenance Task',
                    description: 'Routine maintenance',
                    defaultDurationMinutes: 60,
                    expectedImpactMinutes: 75,
                    isActive: true,
                    createdAt: createdAt2,
                    group: 'Maintenance'
                }
            ];

            const dtoList = ComplementaryTaskCategoryMapper.toListDto(models);

            expect(dtoList).toHaveLength(2);
            expect(dtoList[0].categoryId).toBe('CTC-2025-001');
            expect(dtoList[0].code).toBe('CTC001');
            expect(dtoList[0].name).toBe('Security Check');
            expect(dtoList[1].categoryId).toBe('CTC-2025-002');
            expect(dtoList[1].code).toBe('CTC002');
            expect(dtoList[1].name).toBe('Maintenance Task');
        });

        test('should return empty array for empty input', () => {
            const dtoList = ComplementaryTaskCategoryMapper.toListDto([]);
            
            expect(dtoList).toEqual([]);
            expect(dtoList).toHaveLength(0);
        });

        test('should handle single model array', () => {
            const models = [
                {
                    categoryId: 'CTC-2025-001',
                    code: 'CTC001',
                    name: 'Security Check',
                    description: 'Security inspection',
                    defaultDurationMinutes: 30,
                    expectedImpactMinutes: 45,
                    isActive: true,
                    createdAt: new Date(),
                    group: 'Safety and Security'
                }
            ];

            const dtoList = ComplementaryTaskCategoryMapper.toListDto(models);

            expect(dtoList).toHaveLength(1);
            expect(dtoList[0].categoryId).toBe('CTC-2025-001');
        });

        test('should handle large array of models', () => {
            const models = Array.from({ length: 10 }, (_, index) => ({
                categoryId: `CTC-2025-${index + 1}`,
                code: `CTC${String(index + 1).padStart(3, '0')}`,
                name: `Category ${index + 1}`,
                description: `Description ${index + 1}`,
                defaultDurationMinutes: (index + 1) * 15,
                expectedImpactMinutes: (index + 1) * 20,
                isActive: true,
                createdAt: new Date(),
                group: 'Other'
            }));

            const dtoList = ComplementaryTaskCategoryMapper.toListDto(models);

            expect(dtoList).toHaveLength(10);
            expect(dtoList[0].categoryId).toBe('CTC-2025-1');
            expect(dtoList[9].categoryId).toBe('CTC-2025-10');
            expect(dtoList[5].defaultDurationMinutes).toBe(90); // (5 + 1) * 15
        });

        test('should handle mixed active/inactive categories', () => {
            const models = [
                {
                    categoryId: 'CTC-2025-001',
                    code: 'CTC001',
                    name: 'Active Category',
                    description: 'Active',
                    defaultDurationMinutes: 30,
                    expectedImpactMinutes: 45,
                    isActive: true,
                    createdAt: new Date(),
                    group: 'Other'
                },
                {
                    categoryId: 'CTC-2025-002',
                    code: 'CTC002',
                    name: 'Inactive Category',
                    description: 'Inactive',
                    defaultDurationMinutes: 30,
                    expectedImpactMinutes: 45,
                    isActive: false,
                    createdAt: new Date(),
                    group: 'Other'
                }
            ];

            const dtoList = ComplementaryTaskCategoryMapper.toListDto(models);

            expect(dtoList).toHaveLength(2);
            expect(dtoList[0].isActive).toBe(true);
            expect(dtoList[1].isActive).toBe(false);
        });

        test('should preserve all properties for each model in list', () => {
            const models = [
                {
                    categoryId: 'CTC-2025-001',
                    code: 'CTC001',
                    name: 'Category 1',
                    description: 'Description 1',
                    defaultDurationMinutes: 30,
                    expectedImpactMinutes: 45,
                    isActive: true,
                    createdAt: new Date('2025-01-01'),
                    group: 'Safety and Security'
                },
                {
                    categoryId: 'CTC-2025-002',
                    code: 'CTC002',
                    name: 'Category 2',
                    description: 'Description 2',
                    defaultDurationMinutes: null,
                    expectedImpactMinutes: null,
                    isActive: false,
                    createdAt: new Date('2025-01-02'),
                    group: 'Maintenance'
                }
            ];

            const dtoList = ComplementaryTaskCategoryMapper.toListDto(models);

            // Verify all properties are preserved
            expect(dtoList[0]).toHaveProperty('categoryId');
            expect(dtoList[0]).toHaveProperty('code');
            expect(dtoList[0]).toHaveProperty('name');
            expect(dtoList[0]).toHaveProperty('description');
            expect(dtoList[0]).toHaveProperty('defaultDurationMinutes');
            expect(dtoList[0]).toHaveProperty('expectedImpactMinutes');
            expect(dtoList[0]).toHaveProperty('isActive');
            expect(dtoList[0]).toHaveProperty('createdAt');
            expect(dtoList[0]).toHaveProperty('group');
        });
    });
});

