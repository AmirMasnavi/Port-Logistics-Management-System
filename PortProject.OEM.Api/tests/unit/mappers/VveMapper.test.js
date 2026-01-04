/**
 * Unit Tests for VveMapper
 * 
 * Type: Functional Black-Box Testing with SUT = class
 * Goal: Test Mapper transformation logic in isolation
 * Tool: Jest
 */

import { VveMapper } from '../../../src/application/mappers/VveMapper.js';

describe('Unit Test - VveMapper', () => {
  
  describe('toResponseDto', () => {
    test('should map all fields correctly from model to response DTO', () => {
      const now = new Date();
      const model = {
        vveId: 'VVE-20260103-001',
        vvnId: 'VVN-20260103-001',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: now,
        actualBerthTime: now,
        berthDockId: 'DOCK-A1',
        creatorEmail: 'test@example.com',
        status: 'In Progress',
        actualDepartureTime: null,
        notes: 'Test notes',
        auditLogs: [
          { userId: 'user1', action: 'created', timestamp: now }
        ],
        executedOperations: [
          { operationId: 'OP-001', status: 'PENDING' }
        ],
        createdAt: now,
        updatedAt: now
      };
      
      const dto = VveMapper.toResponseDto(model);
      
      expect(dto.vveId).toBe('VVE-20260103-001');
      expect(dto.vvnId).toBe('VVN-20260103-001');
      expect(dto.vesselIdentifier).toBe('IMO1234567');
      expect(dto.actualArrivalTime).toBe(now);
      expect(dto.actualBerthTime).toBe(now);
      expect(dto.berthDockId).toBe('DOCK-A1');
      expect(dto.creatorEmail).toBe('test@example.com');
      expect(dto.status).toBe('In Progress');
      expect(dto.actualDepartureTime).toBeNull();
      expect(dto.notes).toBe('Test notes');
      expect(dto.auditLogs).toHaveLength(1);
      expect(dto.executedOperations).toHaveLength(1);
      expect(dto.createdAt).toBe(now);
      expect(dto.updatedAt).toBe(now);
    });

    test('should handle model with minimal fields', () => {
      const model = {
        vveId: 'VVE-20260103-001',
        vvnId: 'VVN-20260103-001',
        vesselIdentifier: 'IMO1234567',
        status: 'In Progress'
      };
      
      const dto = VveMapper.toResponseDto(model);
      
      expect(dto.vveId).toBe('VVE-20260103-001');
      expect(dto.auditLogs).toEqual([]);
      expect(dto.executedOperations).toEqual([]);
    });

    test('should map completed VVE with departure time', () => {
      const arrivalTime = new Date('2026-01-03T08:00:00Z');
      const departureTime = new Date('2026-01-03T20:00:00Z');
      
      const model = {
        vveId: 'VVE-20260103-001',
        vvnId: 'VVN-20260103-001',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: arrivalTime,
        status: 'Completed',
        actualDepartureTime: departureTime,
        creatorEmail: 'test@example.com'
      };
      
      const dto = VveMapper.toResponseDto(model);
      
      expect(dto.status).toBe('Completed');
      expect(dto.actualDepartureTime).toBe(departureTime);
    });

    test('should preserve empty arrays when no operations or logs', () => {
      const model = {
        vveId: 'VVE-20260103-001',
        vvnId: 'VVN-20260103-001',
        vesselIdentifier: 'IMO1234567',
        status: 'In Progress',
        auditLogs: [],
        executedOperations: []
      };
      
      const dto = VveMapper.toResponseDto(model);
      
      expect(dto.auditLogs).toEqual([]);
      expect(dto.executedOperations).toEqual([]);
    });
  });

  describe('toListItemDto', () => {
    test('should map essential fields for list display', () => {
      const now = new Date();
      const model = {
        vveId: 'VVE-20260103-001',
        vvnId: 'VVN-20260103-001',
        vesselIdentifier: 'IMO1234567',
        status: 'In Progress',
        actualArrivalTime: now,
        createdAt: now,
        creatorEmail: 'test@example.com',
        // These fields should not be in list item DTO
        notes: 'Should not appear',
        executedOperations: [{ operationId: 'OP-001' }]
      };
      
      const dto = VveMapper.toListItemDto(model);
      
      expect(dto.vveId).toBe('VVE-20260103-001');
      expect(dto.vvnId).toBe('VVN-20260103-001');
      expect(dto.vesselIdentifier).toBe('IMO1234567');
      expect(dto.status).toBe('In Progress');
      expect(dto.actualArrivalTime).toBe(now);
      expect(dto.createdAt).toBe(now);
      expect(dto.creatorEmail).toBe('test@example.com');
      // List item should only contain essential fields
      expect(dto.notes).toBeUndefined();
      expect(dto.executedOperations).toBeUndefined();
    });

    test('should handle different status values', () => {
      const statuses = ['In Progress', 'Completed', 'Cancelled'];
      
      statuses.forEach(status => {
        const model = {
          vveId: 'VVE-20260103-001',
          vvnId: 'VVN-20260103-001',
          vesselIdentifier: 'IMO1234567',
          status: status,
          actualArrivalTime: new Date(),
          createdAt: new Date(),
          creatorEmail: 'test@example.com'
        };
        
        const dto = VveMapper.toListItemDto(model);
        
        expect(dto.status).toBe(status);
      });
    });
  });

  describe('toListDto', () => {
    test('should map array of models to array of list item DTOs', () => {
      const now = new Date();
      const models = [
        {
          vveId: 'VVE-20260103-001',
          vvnId: 'VVN-20260103-001',
          vesselIdentifier: 'IMO1234567',
          status: 'In Progress',
          actualArrivalTime: now,
          createdAt: now,
          creatorEmail: 'user1@example.com'
        },
        {
          vveId: 'VVE-20260103-002',
          vvnId: 'VVN-20260103-002',
          vesselIdentifier: 'IMO7654321',
          status: 'Completed',
          actualArrivalTime: now,
          createdAt: now,
          creatorEmail: 'user2@example.com'
        }
      ];
      
      const dtos = VveMapper.toListDto(models);
      
      expect(dtos).toHaveLength(2);
      expect(dtos[0].vveId).toBe('VVE-20260103-001');
      expect(dtos[0].vesselIdentifier).toBe('IMO1234567');
      expect(dtos[1].vveId).toBe('VVE-20260103-002');
      expect(dtos[1].vesselIdentifier).toBe('IMO7654321');
    });

    test('should return empty array when given empty array', () => {
      const dtos = VveMapper.toListDto([]);
      
      expect(dtos).toEqual([]);
    });

    test('should handle single item array', () => {
      const models = [
        {
          vveId: 'VVE-20260103-001',
          vvnId: 'VVN-20260103-001',
          vesselIdentifier: 'IMO1234567',
          status: 'In Progress',
          actualArrivalTime: new Date(),
          createdAt: new Date(),
          creatorEmail: 'test@example.com'
        }
      ];
      
      const dtos = VveMapper.toListDto(models);
      
      expect(dtos).toHaveLength(1);
      expect(dtos[0].vveId).toBe('VVE-20260103-001');
    });
  });

  describe('toOperationComparisonDto', () => {
    test('should merge planned and executed operation data correctly', () => {
      const plannedOp = {
        operationId: 'OP-001',
        name: 'Container Loading',
        type: 'LOADING',
        startTime: new Date('2026-01-03T10:00:00Z'),
        endTime: new Date('2026-01-03T12:00:00Z'),
        resourceId: 'Crane-1',
        staffId: 'STAFF-001',
        vesselVisitId: 'VV-001',
        vesselImo: 'IMO1234567',
        dockName: 'Dock A'
      };
      
      const executedOp = {
        status: 'COMPLETED',
        startTime: new Date('2026-01-03T10:15:00Z'),
        endTime: new Date('2026-01-03T12:05:00Z'),
        startedBy: 'USER-001',
        completedBy: 'USER-001',
        actualResource: 'Crane-1',
        notes: 'Completed successfully'
      };
      
      const dto = VveMapper.toOperationComparisonDto(plannedOp, executedOp);
      
      // Operation details
      expect(dto.name).toBe('Container Loading');
      expect(dto.type).toBe('LOADING');
      
      // Planned data
      expect(dto.plannedStartTime).toEqual(plannedOp.startTime);
      expect(dto.plannedEndTime).toEqual(plannedOp.endTime);
      expect(dto.plannedResource).toBe('Crane-1');
      expect(dto.plannedStaff).toBe('STAFF-001');
      expect(dto.vesselVisitId).toBe('VV-001');
      
      // Executed data
      expect(dto.executedStatus).toBe('COMPLETED');
      expect(dto.actualStartTime).toEqual(executedOp.startTime);
      expect(dto.actualEndTime).toEqual(executedOp.endTime);
      expect(dto.startedBy).toBe('USER-001');
      expect(dto.completedBy).toBe('USER-001');
      
      // Computed status
      expect(dto.computedStatus).toBe('COMPLETED');
      expect(dto.delayMinutes).toBe(15); // Started 15 min late
      expect(dto.notes).toBe('Completed successfully');
    });

    test('should compute PENDING status when operation not executed', () => {
      const futureTime = new Date(Date.now() + 3600000); // 1 hour in future
      const plannedOp = {
        operationId: 'OP-002',
        name: 'Container Unloading',
        type: 'UNLOADING',
        startTime: futureTime,
        endTime: new Date(futureTime.getTime() + 7200000)
      };
      
      const dto = VveMapper.toOperationComparisonDto(plannedOp, null);
      
      expect(dto.computedStatus).toBe('PENDING');
      expect(dto.executedStatus).toBeNull();
      expect(dto.actualStartTime).toBeNull();
      expect(dto.delayMinutes).toBeNull();
    });

    test('should compute DELAYED status when operation is overdue', () => {
      const pastTime = new Date(Date.now() - 3600000); // 1 hour in past
      const plannedOp = {
        operationId: 'OP-003',
        name: 'Safety Check',
        type: 'Inspection',
        startTime: pastTime,
        endTime: new Date(pastTime.getTime() + 1800000)
      };
      
      const dto = VveMapper.toOperationComparisonDto(plannedOp, null);
      
      expect(dto.computedStatus).toBe('DELAYED');
      expect(dto.delayMinutes).toBeGreaterThan(0);
    });

    test('should handle operation with no planned start time', () => {
      const plannedOp = {
        operationId: 'OP-004',
        name: 'Unscheduled Task',
        type: 'Other',
        startTime: null,
        endTime: null
      };
      
      const dto = VveMapper.toOperationComparisonDto(plannedOp, null);
      
      expect(dto.computedStatus).toBe('PENDING');
      expect(dto.delayMinutes).toBeNull();
    });

    test('should use executed operation name and type when available', () => {
      const plannedOp = {
        operationId: 'OP-005',
        startTime: new Date('2026-01-03T10:00:00Z'),
        endTime: new Date('2026-01-03T12:00:00Z')
      };
      
      const executedOp = {
        name: 'Actual Operation Name',
        type: 'LOADING',
        status: 'STARTED',
        startTime: new Date('2026-01-03T10:00:00Z'),
        startedBy: 'USER-001'
      };
      
      const dto = VveMapper.toOperationComparisonDto(plannedOp, executedOp);
      
      expect(dto.name).toBe('Actual Operation Name');
      expect(dto.type).toBe('LOADING');
    });

    test('should default to empty name and Other type when neither planned nor executed have them', () => {
      const plannedOp = {
        operationId: 'OP-006',
        startTime: new Date(),
        endTime: new Date()
      };
      
      const dto = VveMapper.toOperationComparisonDto(plannedOp, null);
      
      expect(dto.name).toBe('');
      expect(dto.type).toBe('Other');
    });

    test('should calculate delay for started operations', () => {
      const plannedStart = new Date('2026-01-03T10:00:00Z');
      const actualStart = new Date('2026-01-03T10:30:00Z');
      
      const plannedOp = {
        operationId: 'OP-007',
        startTime: plannedStart,
        endTime: new Date('2026-01-03T12:00:00Z')
      };
      
      const executedOp = {
        status: 'STARTED',
        startTime: actualStart,
        startedBy: 'USER-001'
      };
      
      const dto = VveMapper.toOperationComparisonDto(plannedOp, executedOp);
      
      expect(dto.delayMinutes).toBe(30);
      expect(dto.computedStatus).toBe('STARTED');
    });

    test('should handle early start (negative delay)', () => {
      const plannedStart = new Date('2026-01-03T10:00:00Z');
      const actualStart = new Date('2026-01-03T09:50:00Z');
      
      const plannedOp = {
        operationId: 'OP-008',
        startTime: plannedStart,
        endTime: new Date('2026-01-03T12:00:00Z')
      };
      
      const executedOp = {
        status: 'COMPLETED',
        startTime: actualStart,
        endTime: new Date('2026-01-03T11:50:00Z'),
        startedBy: 'USER-001',
        completedBy: 'USER-001'
      };
      
      const dto = VveMapper.toOperationComparisonDto(plannedOp, executedOp);
      
      expect(dto.delayMinutes).toBe(-10); // Started 10 min early
    });

    test('should preserve all vessel and dock information', () => {
      const plannedOp = {
        operationId: 'OP-009',
        vesselVisitId: 'VV-123',
        vesselImo: 'IMO9876543',
        dockName: 'Dock B',
        startTime: new Date(),
        endTime: new Date()
      };
      
      const dto = VveMapper.toOperationComparisonDto(plannedOp, null);
      
      expect(dto.vesselVisitId).toBe('VV-123');
      expect(dto.vesselImo).toBe('IMO9876543');
      expect(dto.dockName).toBe('Dock B');
    });
  });
});

