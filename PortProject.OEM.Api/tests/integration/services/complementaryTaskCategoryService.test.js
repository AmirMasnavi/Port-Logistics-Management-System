/**
 * Integration Tests for ComplementaryTaskCategoryService
 * 
 * Type: Functional Testing with SUT = aggregate
 * Goal: Test the Service interacting with a Mock Repository
 * Tool: Jest with manual mocking
 * 
 * Tests the following scenarios:
 * - createCategory should generate ID and save to repository
 * - createCategory should validate required fields
 * - getCategoryById should fetch from repository
 * - updateCategory should update existing category
 * - deleteCategory should call repository delete
 * - searchCategories should apply filters correctly
 */

import { ComplementaryTaskCategoryService } from '../../../src/services/complementaryTaskCategoriesService.js';
import { CreateComplementaryTaskCategoryDto, UpdateComplementaryTaskCategoryDto } from '../../../src/application/dtos/ComplementaryTaskCategoriesDto.js';

// Helper to create mock functions
const createMockFn = () => {
    const calls = [];
    const mockFn = (...args) => {
        calls.push(args);
        return mockFn._returnValue;
    };
    mockFn.mockResolvedValue = (value) => {
        mockFn._returnValue = Promise.resolve(value);
        return mockFn;
    };
    mockFn.mockRejectedValue = (value) => {
        mockFn._returnValue = Promise.reject(value);
        return mockFn;
    };
    mockFn.mock = { calls };
    return mockFn;
};

describe('Integration Test - ComplementaryTaskCategoryService with Mock Repository', () => {
    
    let service;
    let mockRepository;

    beforeEach(() => {
        mockRepository = {
            create: createMockFn(),
            findById: createMockFn(),
            update: createMockFn(),
            search: createMockFn(),
            delete: createMockFn(),
            findByCode: createMockFn()
        };

        // Create service instance and manually inject mock
        service = new ComplementaryTaskCategoryService();
        service.repository = mockRepository;
    });

    describe('createCategory', () => {
        test('should create category with valid data', async () => {
            // Arrange
            const dto = new CreateComplementaryTaskCategoryDto({
                code: 'CTC001',
                name: 'Security Check',
                description: 'Pre-departure security inspection',
                defaultDurationMinutes: 30,
                expectedImpactMinutes: 45,
                isActive: true,
                group: 'Safety and Security'
            });
            
            mockRepository.search.mockResolvedValue([]); // No duplicate
            mockRepository.create.mockResolvedValue({
                categoryId: 'CTC-2026-123456',
                ...dto,
                createdAt: new Date()
            });

            // Act
            const result = await service.createCategory(dto, 'system');

            // Assert
            expect(result.categoryId).toBe('CTC-2026-123456');
            expect(mockRepository.create.mock.calls.length).toBe(1);
            expect(mockRepository.create.mock.calls[0][0].code).toBe('CTC001');
            expect(mockRepository.create.mock.calls[0][0].name).toBe('Security Check');
        });

        test('should generate categoryId with correct format', async () => {
            // Arrange
            const dto = new CreateComplementaryTaskCategoryDto({
                code: 'CTC001',
                name: 'Security Check'
            });
            
            mockRepository.search.mockResolvedValue([]);
            mockRepository.create.mockResolvedValue({
                categoryId: 'CTC-2026-123456',
                ...dto
            });

            // Act
            await service.createCategory(dto, 'system');

            // Assert
            const createCall = mockRepository.create.mock.calls[0][0];
            expect(createCall.categoryId).toMatch(/^CTC-2026-\d{6}$/);
        });

        test('should throw error when code is missing', async () => {
            // Arrange
            const dto = {
                name: 'Security Check'
            };

            // Act & Assert
            await expect(service.createCategory(dto, 'system'))
                .rejects.toThrow('Code and Name are required');
        });

        test('should throw error when name is missing', async () => {
            // Arrange
            const dto = {
                code: 'CTC001'
            };

            // Act & Assert
            await expect(service.createCategory(dto, 'system'))
                .rejects.toThrow('Code and Name are required');
        });

        test('should throw error when code already exists', async () => {
            // Arrange
            const dto = new CreateComplementaryTaskCategoryDto({
                code: 'CTC001',
                name: 'Security Check'
            });
            
            mockRepository.search.mockResolvedValue([{ 
                code: 'CTC001',
                name: 'Existing Category' 
            }]);

            // Act & Assert
            await expect(service.createCategory(dto, 'system'))
                .rejects.toThrow('already exists');
        });

        test('should default description to empty string', async () => {
            // Arrange
            const dto = new CreateComplementaryTaskCategoryDto({
                code: 'CTC001',
                name: 'Security Check'
            });
            
            mockRepository.search.mockResolvedValue([]);
            mockRepository.create.mockResolvedValue({
                categoryId: 'CTC-2026-123456',
                ...dto,
                description: ''
            });

            // Act
            await service.createCategory(dto, 'system');

            // Assert
            const createCall = mockRepository.create.mock.calls[0][0];
            expect(createCall.description).toBe('');
        });

        test('should default isActive to true', async () => {
            // Arrange
            const dto = new CreateComplementaryTaskCategoryDto({
                code: 'CTC001',
                name: 'Security Check'
            });
            
            mockRepository.search.mockResolvedValue([]);
            mockRepository.create.mockResolvedValue({
                categoryId: 'CTC-2026-123456',
                ...dto,
                isActive: true
            });

            // Act
            await service.createCategory(dto, 'system');

            // Assert
            const createCall = mockRepository.create.mock.calls[0][0];
            expect(createCall.isActive).toBe(true);
        });

        test('should default group to Other', async () => {
            // Arrange
            const dto = new CreateComplementaryTaskCategoryDto({
                code: 'CTC001',
                name: 'Security Check'
            });
            
            mockRepository.search.mockResolvedValue([]);
            mockRepository.create.mockResolvedValue({
                categoryId: 'CTC-2026-123456',
                ...dto,
                group: 'Other'
            });

            // Act
            await service.createCategory(dto, 'system');

            // Assert
            const createCall = mockRepository.create.mock.calls[0][0];
            expect(createCall.group).toBe('Other');
        });

        test('should accept all valid group values', async () => {
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

            for (const group of validGroups) {
                // Arrange
                const dto = new CreateComplementaryTaskCategoryDto({
                    code: `CTC-${group}`,
                    name: 'Test Category',
                    group: group
                });
                
                mockRepository.search.mockResolvedValue([]);
                mockRepository.create.mockResolvedValue({
                    categoryId: 'CTC-2026-123456',
                    ...dto
                });

                // Act
                await service.createCategory(dto, 'system');

                // Assert
                const createCall = mockRepository.create.mock.calls[mockRepository.create.mock.calls.length - 1][0];
                expect(createCall.group).toBe(group);
            }
        });

        test('should handle null duration values', async () => {
            // Arrange
            const dto = new CreateComplementaryTaskCategoryDto({
                code: 'CTC001',
                name: 'Variable Task',
                defaultDurationMinutes: null,
                expectedImpactMinutes: null
            });
            
            mockRepository.search.mockResolvedValue([]);
            mockRepository.create.mockResolvedValue({
                categoryId: 'CTC-2026-123456',
                ...dto
            });

            // Act
            await service.createCategory(dto, 'system');

            // Assert
            const createCall = mockRepository.create.mock.calls[0][0];
            expect(createCall.defaultDurationMinutes).toBeNull();
            expect(createCall.expectedImpactMinutes).toBeNull();
        });

        test('should handle zero duration values', async () => {
            // Arrange
            const dto = new CreateComplementaryTaskCategoryDto({
                code: 'CTC001',
                name: 'Instant Task',
                defaultDurationMinutes: 0,
                expectedImpactMinutes: 0
            });
            
            mockRepository.search.mockResolvedValue([]);
            mockRepository.create.mockResolvedValue({
                categoryId: 'CTC-2026-123456',
                ...dto
            });

            // Act
            await service.createCategory(dto, 'system');

            // Assert
            const createCall = mockRepository.create.mock.calls[0][0];
            expect(createCall.defaultDurationMinutes).toBe(0);
            expect(createCall.expectedImpactMinutes).toBe(0);
        });

        test('should create inactive category', async () => {
            // Arrange
            const dto = new CreateComplementaryTaskCategoryDto({
                code: 'CTC001',
                name: 'Deprecated Category',
                isActive: false
            });
            
            mockRepository.search.mockResolvedValue([]);
            mockRepository.create.mockResolvedValue({
                categoryId: 'CTC-2026-123456',
                ...dto
            });

            // Act
            await service.createCategory(dto, 'system');

            // Assert
            const createCall = mockRepository.create.mock.calls[0][0];
            expect(createCall.isActive).toBe(false);
        });
    });

    describe('getCategoryById', () => {
        test('should retrieve category by ID', async () => {
            // Arrange
            const mockCategory = {
                categoryId: 'CTC-2026-123456',
                code: 'CTC001',
                name: 'Security Check',
                description: 'Security inspection',
                defaultDurationMinutes: 30,
                expectedImpactMinutes: 45,
                isActive: true,
                group: 'Safety and Security'
            };
            mockRepository.findById.mockResolvedValue(mockCategory);

            // Act
            const result = await service.getCategoryById('CTC-2026-123456');

            // Assert
            expect(result).toEqual(mockCategory);
            expect(mockRepository.findById.mock.calls.length).toBe(1);
            expect(mockRepository.findById.mock.calls[0][0]).toBe('CTC-2026-123456');
        });

        test('should throw error when category not found', async () => {
            // Arrange
            mockRepository.findById.mockResolvedValue(null);

            // Act & Assert
            await expect(service.getCategoryById('NONEXISTENT'))
                .rejects.toThrow('not found');
        });
    });

    describe('updateCategory', () => {
        test('should update category name', async () => {
            // Arrange
            const existingCategory = {
                categoryId: 'CTC-2026-123456',
                code: 'CTC001',
                name: 'Old Name',
                description: 'Description',
                isActive: true,
                group: 'Other'
            };
            const dto = new UpdateComplementaryTaskCategoryDto({
                name: 'New Name'
            });
            
            mockRepository.findById.mockResolvedValue(existingCategory);
            mockRepository.update.mockResolvedValue({
                ...existingCategory,
                name: 'New Name'
            });

            // Act
            const result = await service.updateCategory('CTC-2026-123456', dto, 'user');

            // Assert
            expect(result.name).toBe('New Name');
            expect(mockRepository.update.mock.calls.length).toBe(1);
        });

        test('should update description', async () => {
            // Arrange
            const existingCategory = {
                categoryId: 'CTC-2026-123456',
                code: 'CTC001',
                name: 'Security Check',
                description: 'Old description',
                isActive: true,
                group: 'Other'
            };
            const dto = new UpdateComplementaryTaskCategoryDto({
                description: 'New description'
            });
            
            mockRepository.findById.mockResolvedValue(existingCategory);
            mockRepository.update.mockResolvedValue({
                ...existingCategory,
                description: 'New description'
            });

            // Act
            const result = await service.updateCategory('CTC-2026-123456', dto, 'user');

            // Assert
            expect(result.description).toBe('New description');
        });

        test('should update duration values', async () => {
            // Arrange
            const existingCategory = {
                categoryId: 'CTC-2026-123456',
                code: 'CTC001',
                name: 'Security Check',
                defaultDurationMinutes: 30,
                expectedImpactMinutes: 45,
                isActive: true,
                group: 'Other'
            };
            const dto = new UpdateComplementaryTaskCategoryDto({
                defaultDurationMinutes: 60,
                expectedImpactMinutes: 90
            });
            
            mockRepository.findById.mockResolvedValue(existingCategory);
            mockRepository.update.mockResolvedValue({
                ...existingCategory,
                defaultDurationMinutes: 60,
                expectedImpactMinutes: 90
            });

            // Act
            const result = await service.updateCategory('CTC-2026-123456', dto, 'user');

            // Assert
            expect(result.defaultDurationMinutes).toBe(60);
            expect(result.expectedImpactMinutes).toBe(90);
        });

        test('should update isActive status', async () => {
            // Arrange
            const existingCategory = {
                categoryId: 'CTC-2026-123456',
                code: 'CTC001',
                name: 'Security Check',
                isActive: true,
                group: 'Other'
            };
            const dto = new UpdateComplementaryTaskCategoryDto({
                isActive: false
            });
            
            mockRepository.findById.mockResolvedValue(existingCategory);
            mockRepository.update.mockResolvedValue({
                ...existingCategory,
                isActive: false
            });

            // Act
            const result = await service.updateCategory('CTC-2026-123456', dto, 'user');

            // Assert
            expect(result.isActive).toBe(false);
        });

        test('should update group', async () => {
            // Arrange
            const existingCategory = {
                categoryId: 'CTC-2026-123456',
                code: 'CTC001',
                name: 'Security Check',
                isActive: true,
                group: 'Other'
            };
            const dto = new UpdateComplementaryTaskCategoryDto({
                group: 'Maintenance'
            });
            
            mockRepository.findById.mockResolvedValue(existingCategory);
            mockRepository.update.mockResolvedValue({
                ...existingCategory,
                group: 'Maintenance'
            });

            // Act
            const result = await service.updateCategory('CTC-2026-123456', dto, 'user');

            // Assert
            expect(result.group).toBe('Maintenance');
        });

        test('should update multiple fields at once', async () => {
            // Arrange
            const existingCategory = {
                categoryId: 'CTC-2026-123456',
                code: 'CTC001',
                name: 'Old Name',
                description: 'Old description',
                defaultDurationMinutes: 30,
                expectedImpactMinutes: 45,
                isActive: true,
                group: 'Other'
            };
            const dto = new UpdateComplementaryTaskCategoryDto({
                name: 'New Name',
                description: 'New description',
                defaultDurationMinutes: 120,
                expectedImpactMinutes: 150,
                isActive: false,
                group: 'Maintenance'
            });
            
            mockRepository.findById.mockResolvedValue(existingCategory);
            mockRepository.update.mockResolvedValue({
                ...existingCategory,
                ...dto
            });

            // Act
            const result = await service.updateCategory('CTC-2026-123456', dto, 'user');

            // Assert
            expect(result.name).toBe('New Name');
            expect(result.description).toBe('New description');
            expect(result.defaultDurationMinutes).toBe(120);
            expect(result.expectedImpactMinutes).toBe(150);
            expect(result.isActive).toBe(false);
            expect(result.group).toBe('Maintenance');
        });

        test('should throw error when category not found', async () => {
            // Arrange
            const dto = new UpdateComplementaryTaskCategoryDto({
                name: 'New Name'
            });
            mockRepository.findById.mockResolvedValue(null);

            // Act & Assert
            await expect(service.updateCategory('NONEXISTENT', dto, 'user'))
                .rejects.toThrow('not found');
        });

        test('should handle empty update DTO', async () => {
            // Arrange
            const existingCategory = {
                categoryId: 'CTC-2026-123456',
                code: 'CTC001',
                name: 'Security Check',
                isActive: true,
                group: 'Other'
            };
            const dto = new UpdateComplementaryTaskCategoryDto({});
            
            mockRepository.findById.mockResolvedValue(existingCategory);
            mockRepository.update.mockResolvedValue(existingCategory);

            // Act
            const result = await service.updateCategory('CTC-2026-123456', dto, 'user');

            // Assert
            expect(result).toEqual(existingCategory);
        });
    });

    describe('deleteCategory', () => {
        test('should delete category by ID', async () => {
            // Arrange
            const mockCategory = {
                categoryId: 'CTC-2026-123456',
                code: 'CTC001',
                name: 'Security Check',
                isActive: true
            };
            mockRepository.findById.mockResolvedValue(mockCategory);
            mockRepository.delete.mockResolvedValue(true);

            // Act
            await service.deleteCategory('CTC-2026-123456', 'user');

            // Assert
            expect(mockRepository.delete.mock.calls.length).toBe(1);
            expect(mockRepository.delete.mock.calls[0][0]).toBe('CTC-2026-123456');
        });

        test('should throw error when category not found', async () => {
            // Arrange
            mockRepository.findById.mockResolvedValue(null);

            // Act & Assert
            await expect(service.deleteCategory('NONEXISTENT', 'user'))
                .rejects.toThrow('not found');
        });
    });

    describe('searchCategories', () => {
        test('should search without filters', async () => {
            // Arrange
            const mockCategories = [
                { categoryId: 'CTC-1', code: 'CTC001', name: 'Category 1', isActive: true, group: 'Other' },
                { categoryId: 'CTC-2', code: 'CTC002', name: 'Category 2', isActive: true, group: 'Maintenance' }
            ];
            mockRepository.search.mockResolvedValue(mockCategories);

            // Act
            const result = await service.searchCategories({});

            // Assert
            expect(result).toEqual(mockCategories);
            expect(mockRepository.search.mock.calls.length).toBe(1);
        });

        test('should filter by code', async () => {
            // Arrange
            const mockCategories = [
                { categoryId: 'CTC-1', code: 'CTC001', name: 'Category 1', isActive: true, group: 'Other' }
            ];
            mockRepository.search.mockResolvedValue(mockCategories);

            // Act
            const result = await service.searchCategories({ code: 'CTC001' });

            // Assert
            expect(result).toEqual(mockCategories);
            expect(mockRepository.search.mock.calls[0][0]).toEqual({ code: 'CTC001' });
        });

        test('should filter by nameContains', async () => {
            // Arrange
            const mockCategories = [
                { categoryId: 'CTC-1', code: 'CTC001', name: 'Security Check', isActive: true, group: 'Safety and Security' }
            ];
            mockRepository.search.mockResolvedValue(mockCategories);

            // Act
            const result = await service.searchCategories({ nameContains: 'Security' });

            // Assert
            expect(result).toEqual(mockCategories);
        });

        test('should filter by active status', async () => {
            // Arrange
            const mockCategories = [
                { categoryId: 'CTC-1', code: 'CTC001', name: 'Active Category', isActive: true, group: 'Other' }
            ];
            mockRepository.search.mockResolvedValue(mockCategories);

            // Act
            const result = await service.searchCategories({ active: true });

            // Assert
            expect(result).toEqual(mockCategories);
        });

        test('should filter by group', async () => {
            // Arrange
            const mockCategories = [
                { categoryId: 'CTC-1', code: 'CTC001', name: 'Maintenance Task', isActive: true, group: 'Maintenance' }
            ];
            mockRepository.search.mockResolvedValue(mockCategories);

            // Act
            const result = await service.searchCategories({ group: 'Maintenance' });

            // Assert
            expect(result).toEqual(mockCategories);
        });

        test('should filter by defaultDurationMinutes', async () => {
            // Arrange
            const mockCategories = [
                { categoryId: 'CTC-1', code: 'CTC001', name: 'Category 1', defaultDurationMinutes: 30, isActive: true, group: 'Other' }
            ];
            mockRepository.search.mockResolvedValue(mockCategories);

            // Act
            const result = await service.searchCategories({ defaultDurationMinutes: 30 });

            // Assert
            expect(result).toEqual(mockCategories);
        });

        test('should filter by expectedImpactMinutes', async () => {
            // Arrange
            const mockCategories = [
                { categoryId: 'CTC-1', code: 'CTC001', name: 'Category 1', expectedImpactMinutes: 45, isActive: true, group: 'Other' }
            ];
            mockRepository.search.mockResolvedValue(mockCategories);

            // Act
            const result = await service.searchCategories({ expectedImpactMinutes: 45 });

            // Assert
            expect(result).toEqual(mockCategories);
        });

        test('should apply multiple filters', async () => {
            // Arrange
            const mockCategories = [
                { 
                    categoryId: 'CTC-1', 
                    code: 'CTC001', 
                    name: 'Security Check',
                    defaultDurationMinutes: 30,
                    expectedImpactMinutes: 45,
                    isActive: true, 
                    group: 'Safety and Security' 
                }
            ];
            mockRepository.search.mockResolvedValue(mockCategories);

            // Act
            const result = await service.searchCategories({ 
                active: true,
                group: 'Safety and Security',
                defaultDurationMinutes: 30
            });

            // Assert
            expect(result).toEqual(mockCategories);
        });

        test('should return empty array when no matches', async () => {
            // Arrange
            mockRepository.search.mockResolvedValue([]);

            // Act
            const result = await service.searchCategories({ code: 'NONEXISTENT' });

            // Assert
            expect(result).toEqual([]);
        });
    });


    describe('Edge Cases', () => {
        test('should handle repository errors gracefully', async () => {
            // Arrange
            const dto = new CreateComplementaryTaskCategoryDto({
                code: 'CTC001',
                name: 'Security Check'
            });
            mockRepository.search.mockResolvedValue([]);
            mockRepository.create.mockRejectedValue(new Error('Database error'));

            // Act & Assert
            await expect(service.createCategory(dto, 'system'))
                .rejects.toThrow('Database error');
        });

        test('should handle very long descriptions', async () => {
            // Arrange
            const longDescription = 'A'.repeat(5000);
            const dto = new CreateComplementaryTaskCategoryDto({
                code: 'CTC001',
                name: 'Test Category',
                description: longDescription
            });
            
            mockRepository.search.mockResolvedValue([]);
            mockRepository.create.mockResolvedValue({
                categoryId: 'CTC-2026-123456',
                ...dto
            });

            // Act
            await service.createCategory(dto, 'system');

            // Assert
            const createCall = mockRepository.create.mock.calls[0][0];
            expect(createCall.description).toBe(longDescription);
        });

        test('should handle large duration values', async () => {
            // Arrange
            const dto = new CreateComplementaryTaskCategoryDto({
                code: 'CTC001',
                name: 'Extended Task',
                defaultDurationMinutes: 10080, // 1 week
                expectedImpactMinutes: 20160  // 2 weeks
            });
            
            mockRepository.search.mockResolvedValue([]);
            mockRepository.create.mockResolvedValue({
                categoryId: 'CTC-2026-123456',
                ...dto
            });

            // Act
            await service.createCategory(dto, 'system');

            // Assert
            const createCall = mockRepository.create.mock.calls[0][0];
            expect(createCall.defaultDurationMinutes).toBe(10080);
            expect(createCall.expectedImpactMinutes).toBe(20160);
        });
    });
});

