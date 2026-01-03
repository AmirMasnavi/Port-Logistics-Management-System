/**
 * US 4.1.6 - Resource Metrics Service Tests
 */
import { ResourceMetricsService } from '../src/services/resourceMetricsService.js';

// Mock repository
const mockRepository = {
    findAll: jest.fn()
};

describe('ResourceMetricsService', () => {
    let service;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new ResourceMetricsService(mockRepository);
    });

    describe('getResourceAllocationSummary', () => {
        it('should return zero allocation when no plans exist', async () => {
            mockRepository.findAll.mockResolvedValue([]);

            const result = await service.getResourceAllocationSummary(
                'crane',
                'CR-01',
                new Date('2025-12-01T00:00:00Z'),
                new Date('2025-12-07T23:59:59Z')
            );

            expect(result.resourceType).toBe('crane');
            expect(result.resourceId).toBe('CR-01');
            expect(result.totalAllocatedMinutes).toBe(0);
            expect(result.numberOfOperations).toBe(0);
        });

        it('should calculate allocation time for matching resource', async () => {
            const mockPlan = {
                planId: 'PLAN-001',
                status: 'Confirmed',
                scheduledTasks: [
                    {
                        _id: 'task-1',
                        resourceId: 'CR-01',
                        resourceKind: 'Crane',
                        startTime: new Date('2025-12-02T08:00:00Z'),
                        endTime: new Date('2025-12-02T10:00:00Z') // 2 hours = 120 minutes
                    }
                ]
            };

            mockRepository.findAll.mockResolvedValue([mockPlan]);

            const result = await service.getResourceAllocationSummary(
                'crane',
                'CR-01',
                new Date('2025-12-01T00:00:00Z'),
                new Date('2025-12-07T23:59:59Z')
            );

            expect(result.totalAllocatedMinutes).toBe(120);
            expect(result.totalAllocatedHours).toBe(2);
            expect(result.numberOfOperations).toBe(1);
        });

        it('should clip allocation time to period boundaries', async () => {
            const mockPlan = {
                planId: 'PLAN-001',
                status: 'Confirmed',
                scheduledTasks: [
                    {
                        _id: 'task-1',
                        resourceId: 'CR-01',
                        resourceKind: 'Crane',
                        // Task spans from before period start to after period end
                        startTime: new Date('2025-12-01T06:00:00Z'),
                        endTime: new Date('2025-12-01T12:00:00Z')
                    }
                ]
            };

            mockRepository.findAll.mockResolvedValue([mockPlan]);

            // Query only from 08:00 to 10:00 (2 hours overlap)
            const result = await service.getResourceAllocationSummary(
                'crane',
                'CR-01',
                new Date('2025-12-01T08:00:00Z'),
                new Date('2025-12-01T10:00:00Z')
            );

            expect(result.totalAllocatedMinutes).toBe(120); // Only 2 hours within period
        });

        it('should ignore non-confirmed plans', async () => {
            const mockPlan = {
                planId: 'PLAN-001',
                status: 'Draft', // Not confirmed
                scheduledTasks: [
                    {
                        _id: 'task-1',
                        resourceId: 'CR-01',
                        startTime: new Date('2025-12-02T08:00:00Z'),
                        endTime: new Date('2025-12-02T10:00:00Z')
                    }
                ]
            };

            mockRepository.findAll.mockResolvedValue([mockPlan]);

            const result = await service.getResourceAllocationSummary(
                'crane',
                'CR-01',
                new Date('2025-12-01T00:00:00Z'),
                new Date('2025-12-07T23:59:59Z')
            );

            expect(result.totalAllocatedMinutes).toBe(0);
            expect(result.numberOfOperations).toBe(0);
        });

        it('should match dock resources correctly', async () => {
            const mockPlan = {
                planId: 'PLAN-001',
                status: 'Confirmed',
                scheduledTasks: [
                    {
                        _id: 'task-1',
                        dockId: 'DOCK-A',
                        dockName: 'Dock Alpha',
                        startTime: new Date('2025-12-02T08:00:00Z'),
                        endTime: new Date('2025-12-02T12:00:00Z') // 4 hours
                    }
                ]
            };

            mockRepository.findAll.mockResolvedValue([mockPlan]);

            const result = await service.getResourceAllocationSummary(
                'dock',
                'DOCK-A',
                new Date('2025-12-01T00:00:00Z'),
                new Date('2025-12-07T23:59:59Z')
            );

            expect(result.totalAllocatedMinutes).toBe(240);
            expect(result.numberOfOperations).toBe(1);
        });

        it('should match staff resources correctly', async () => {
            const mockPlan = {
                planId: 'PLAN-001',
                status: 'Confirmed',
                scheduledTasks: [
                    {
                        _id: 'task-1',
                        staffId: 'MEC001',
                        staffShortName: 'John Doe',
                        startTime: new Date('2025-12-02T09:00:00Z'),
                        endTime: new Date('2025-12-02T11:30:00Z') // 2.5 hours = 150 minutes
                    }
                ]
            };

            mockRepository.findAll.mockResolvedValue([mockPlan]);

            const result = await service.getResourceAllocationSummary(
                'staff',
                'MEC001',
                new Date('2025-12-01T00:00:00Z'),
                new Date('2025-12-07T23:59:59Z')
            );

            expect(result.totalAllocatedMinutes).toBe(150);
            expect(result.numberOfOperations).toBe(1);
        });

        it('should throw error when end date is before start date', async () => {
            await expect(
                service.getResourceAllocationSummary(
                    'crane',
                    'CR-01',
                    new Date('2025-12-07T00:00:00Z'),
                    new Date('2025-12-01T00:00:00Z')
                )
            ).rejects.toThrow('End date must be after start date');
        });
    });
});

