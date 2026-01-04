/**
 * Unit Tests for SmartOperationGenerator
 * 
 * Type: Functional Black-Box Testing with SUT = utility functions
 * Goal: Test operation generation logic and merging with execution data
 * Tool: Jest
 */

import {
  generateSmartOperations,
  mergeOperationsWithExecutionData
} from '../../../src/application/utils/SmartOperationGenerator.js';

describe('Unit Test - SmartOperationGenerator', () => {
  
  describe('generateSmartOperations', () => {
    test('should generate 5 operations for a task', () => {
      const task = {
        _id: 'TASK-001',
        resourceId: 'RES-001',
        startTime: '2026-01-03T08:00:00Z',
        endTime: '2026-01-03T10:00:00Z'
      };

      const operations = generateSmartOperations(task);

      expect(operations).toHaveLength(5);
    });

    test('should generate operations with correct types in sequence', () => {
      const task = {
        _id: 'TASK-002',
        resourceId: 'RES-002',
        startTime: '2026-01-03T08:00:00Z',
        endTime: '2026-01-03T10:00:00Z'
      };

      const operations = generateSmartOperations(task);

      expect(operations[0].type).toBe('WAITING');
      expect(operations[1].type).toBe('UNLOADING');
      expect(operations[2].type).toBe('UNLOADING');
      expect(operations[3].type).toBe('LOADING');
      expect(operations[4].type).toBe('LOADING');
    });

    test('should generate operations with correct names', () => {
      const task = {
        _id: 'TASK-003',
        resourceId: 'RES-003',
        startTime: '2026-01-03T08:00:00Z',
        endTime: '2026-01-03T10:00:00Z'
      };

      const operations = generateSmartOperations(task);

      expect(operations[0].name).toBe('Safety Clearance & Positioning');
      expect(operations[1].name).toBe('Deck/Hatch Clearance');
      expect(operations[2].name).toBe('Principal Cargo Discharge');
      expect(operations[3].name).toBe('Principal Cargo Loading');
      expect(operations[4].name).toBe('Lashing & Securing');
    });

    test('should generate operations with correct IDs based on task ID', () => {
      const task = {
        _id: 'TASK-004',
        resourceId: 'RES-004',
        startTime: '2026-01-03T08:00:00Z',
        endTime: '2026-01-03T10:00:00Z'
      };

      const operations = generateSmartOperations(task);

      expect(operations[0].operationId).toBe('TASK-004_wait_1');
      expect(operations[1].operationId).toBe('TASK-004_unload_1');
      expect(operations[2].operationId).toBe('TASK-004_unload_2');
      expect(operations[3].operationId).toBe('TASK-004_load_1');
      expect(operations[4].operationId).toBe('TASK-004_load_2');
    });

    test('should handle task with "id" field instead of "_id"', () => {
      const task = {
        id: 'TASK-005',
        resourceId: 'RES-005',
        startTime: '2026-01-03T08:00:00Z',
        endTime: '2026-01-03T10:00:00Z'
      };

      const operations = generateSmartOperations(task);

      expect(operations[0].operationId).toBe('TASK-005_wait_1');
      expect(operations[0].parentTaskId).toBe('TASK-005');
    });

    test('should handle task without id field', () => {
      const task = {
        resourceId: 'RES-006',
        startTime: '2026-01-03T08:00:00Z',
        endTime: '2026-01-03T10:00:00Z'
      };

      const operations = generateSmartOperations(task);

      expect(operations[0].operationId).toBe('task_wait_1');
    });

    test('should set all operations to PENDING status initially', () => {
      const task = {
        _id: 'TASK-007',
        resourceId: 'RES-007',
        startTime: '2026-01-03T08:00:00Z',
        endTime: '2026-01-03T10:00:00Z'
      };

      const operations = generateSmartOperations(task);

      operations.forEach(op => {
        expect(op.status).toBe('PENDING');
      });
    });

    test('should set resourceId from task', () => {
      const task = {
        _id: 'TASK-008',
        resourceId: 'RES-008',
        startTime: '2026-01-03T08:00:00Z',
        endTime: '2026-01-03T10:00:00Z'
      };

      const operations = generateSmartOperations(task);

      operations.forEach(op => {
        expect(op.resourceId).toBe('RES-008');
      });
    });

    test('should generate operations that span the entire task duration', () => {
      const task = {
        _id: 'TASK-009',
        resourceId: 'RES-009',
        startTime: '2026-01-03T08:00:00Z',
        endTime: '2026-01-03T10:00:00Z'
      };

      const operations = generateSmartOperations(task);

      const firstOpStart = new Date(operations[0].plannedStartTime);
      const lastOpEnd = new Date(operations[4].plannedEndTime);

      expect(firstOpStart.toISOString()).toBe('2026-01-03T08:00:00.000Z');
      expect(lastOpEnd.toISOString()).toBe('2026-01-03T10:00:00.000Z');
    });

    test('should initialize actualStartTime and actualEndTime with planned times', () => {
      const task = {
        _id: 'TASK-010',
        resourceId: 'RES-010',
        startTime: '2026-01-03T08:00:00Z',
        endTime: '2026-01-03T10:00:00Z'
      };

      const operations = generateSmartOperations(task);

      operations.forEach(op => {
        expect(op.actualStartTime).toBe(op.plannedStartTime);
        expect(op.actualEndTime).toBe(op.plannedEndTime);
      });
    });

    test('should limit waiting time to maximum 30 minutes', () => {
      const task = {
        _id: 'TASK-011',
        resourceId: 'RES-011',
        startTime: '2026-01-03T08:00:00Z',
        endTime: '2026-01-03T18:00:00Z' // 10 hours
      };

      const operations = generateSmartOperations(task);

      const waitOp = operations[0];
      const waitStart = new Date(waitOp.plannedStartTime);
      const waitEnd = new Date(waitOp.plannedEndTime);
      const waitDurationMs = waitEnd - waitStart;
      const waitDurationMinutes = waitDurationMs / (60 * 1000);

      expect(waitDurationMinutes).toBeLessThanOrEqual(30);
    });

    test('should apply time offset when actualStartTime is provided', () => {
      const task = {
        _id: 'TASK-012',
        resourceId: 'RES-012',
        startTime: '2026-01-03T08:00:00Z',
        endTime: '2026-01-03T10:00:00Z'
      };

      const actualStartTime = new Date('2026-01-03T09:00:00Z'); // 1 hour delay

      const operations = generateSmartOperations(task, actualStartTime);

      const firstOpStart = new Date(operations[0].plannedStartTime);
      expect(firstOpStart.toISOString()).toBe('2026-01-03T09:00:00.000Z');
    });

    test('should apply negative time offset when actualStartTime is earlier', () => {
      const task = {
        _id: 'TASK-013',
        resourceId: 'RES-013',
        startTime: '2026-01-03T08:00:00Z',
        endTime: '2026-01-03T10:00:00Z'
      };

      const actualStartTime = new Date('2026-01-03T07:30:00Z'); // 30 minutes early

      const operations = generateSmartOperations(task, actualStartTime);

      const firstOpStart = new Date(operations[0].plannedStartTime);
      expect(firstOpStart.toISOString()).toBe('2026-01-03T07:30:00.000Z');
    });

    test('should maintain task duration even with actualStartTime offset', () => {
      const task = {
        _id: 'TASK-014',
        resourceId: 'RES-014',
        startTime: '2026-01-03T08:00:00Z',
        endTime: '2026-01-03T10:00:00Z' // 2 hours
      };

      const actualStartTime = new Date('2026-01-03T09:00:00Z'); // 1 hour delay

      const operations = generateSmartOperations(task, actualStartTime);

      const firstOpStart = new Date(operations[0].plannedStartTime);
      const lastOpEnd = new Date(operations[4].plannedEndTime);
      const totalDurationMs = lastOpEnd - firstOpStart;
      const totalDurationHours = totalDurationMs / (1000 * 60 * 60);

      expect(totalDurationHours).toBe(2);
    });

    test('should have sequential operation times without gaps', () => {
      const task = {
        _id: 'TASK-015',
        resourceId: 'RES-015',
        startTime: '2026-01-03T08:00:00Z',
        endTime: '2026-01-03T10:00:00Z'
      };

      const operations = generateSmartOperations(task);

      for (let i = 0; i < operations.length - 1; i++) {
        const currentEnd = operations[i].plannedEndTime;
        const nextStart = operations[i + 1].plannedStartTime;
        expect(currentEnd).toBe(nextStart);
      }
    });

    test('should allocate approximately 10% time to waiting (for short tasks)', () => {
      const task = {
        _id: 'TASK-016',
        resourceId: 'RES-016',
        startTime: '2026-01-03T08:00:00Z',
        endTime: '2026-01-03T08:30:00Z' // 30 minutes total
      };

      const operations = generateSmartOperations(task);

      const waitOp = operations[0];
      const waitStart = new Date(waitOp.plannedStartTime);
      const waitEnd = new Date(waitOp.plannedEndTime);
      const waitDurationMs = waitEnd - waitStart;
      
      const taskStart = new Date(task.startTime);
      const taskEnd = new Date(task.endTime);
      const totalDurationMs = taskEnd - taskStart;
      
      const waitPercentage = waitDurationMs / totalDurationMs;

      expect(waitPercentage).toBeCloseTo(0.10, 1);
    });

    test('should split working time equally between unloading and loading', () => {
      const task = {
        _id: 'TASK-017',
        resourceId: 'RES-017',
        startTime: '2026-01-03T08:00:00Z',
        endTime: '2026-01-03T10:00:00Z'
      };

      const operations = generateSmartOperations(task);

      // Calculate unloading duration (ops 1 and 2)
      const unload1Start = new Date(operations[1].plannedStartTime);
      const unload1End = new Date(operations[1].plannedEndTime);
      const unload2Start = new Date(operations[2].plannedStartTime);
      const unload2End = new Date(operations[2].plannedEndTime);
      const unloadDuration = (unload1End - unload1Start) + (unload2End - unload2Start);

      // Calculate loading duration (ops 3 and 4)
      const load1Start = new Date(operations[3].plannedStartTime);
      const load1End = new Date(operations[3].plannedEndTime);
      const load2Start = new Date(operations[4].plannedStartTime);
      const load2End = new Date(operations[4].plannedEndTime);
      const loadDuration = (load1End - load1Start) + (load2End - load2Start);

      expect(unloadDuration).toBe(loadDuration);
    });
  });

  describe('mergeOperationsWithExecutionData', () => {
    test('should return generated operations when no execution data exists', () => {
      const generatedOps = [
        {
          operationId: 'OP-001',
          name: 'Test Operation',
          type: 'LOADING',
          status: 'PENDING'
        }
      ];

      const executedOps = [];

      const merged = mergeOperationsWithExecutionData(generatedOps, executedOps);

      expect(merged).toHaveLength(1);
      expect(merged[0].operationId).toBe('OP-001');
      expect(merged[0].computedStatus).toBe('PENDING');
    });

    test('should merge with saved execution data when available', () => {
      const generatedOps = [
        {
          operationId: 'OP-002',
          name: 'Test Operation',
          type: 'LOADING',
          status: 'PENDING',
          plannedStartTime: '2026-01-03T08:00:00Z',
          plannedEndTime: '2026-01-03T09:00:00Z'
        }
      ];

      const executedOps = [
        {
          operationId: 'OP-002',
          status: 'COMPLETED',
          startTime: '2026-01-03T08:15:00Z',
          endTime: '2026-01-03T09:10:00Z',
          startedBy: 'USR-123',
          completedBy: 'USR-123',
          actualResource: 'RES-456',
          notes: 'Delayed start'
        }
      ];

      const merged = mergeOperationsWithExecutionData(generatedOps, executedOps);

      expect(merged).toHaveLength(1);
      expect(merged[0].executedStatus).toBe('COMPLETED');
      expect(merged[0].computedStatus).toBe('COMPLETED');
      expect(merged[0].actualStartTime).toBe('2026-01-03T08:15:00Z');
      expect(merged[0].actualEndTime).toBe('2026-01-03T09:10:00Z');
      expect(merged[0].startedBy).toBe('USR-123');
      expect(merged[0].completedBy).toBe('USR-123');
      expect(merged[0].actualResource).toBe('RES-456');
      expect(merged[0].notes).toBe('Delayed start');
    });

    test('should preserve original generated operation properties', () => {
      const generatedOps = [
        {
          operationId: 'OP-003',
          name: 'Original Name',
          type: 'UNLOADING',
          status: 'PENDING',
          resourceId: 'RES-001',
          plannedStartTime: '2026-01-03T08:00:00Z',
          plannedEndTime: '2026-01-03T09:00:00Z'
        }
      ];

      const executedOps = [];

      const merged = mergeOperationsWithExecutionData(generatedOps, executedOps);

      expect(merged[0].operationId).toBe('OP-003');
      expect(merged[0].name).toBe('Original Name');
      expect(merged[0].type).toBe('UNLOADING');
      expect(merged[0].resourceId).toBe('RES-001');
      expect(merged[0].plannedStartTime).toBe('2026-01-03T08:00:00Z');
    });

    test('should override name and type if customized in saved operation', () => {
      const generatedOps = [
        {
          operationId: 'OP-004',
          name: 'Original Name',
          type: 'LOADING',
          status: 'PENDING'
        }
      ];

      const executedOps = [
        {
          operationId: 'OP-004',
          name: 'Custom Name',
          type: 'UNLOADING',
          status: 'STARTED',
          startTime: '2026-01-03T08:00:00Z'
        }
      ];

      const merged = mergeOperationsWithExecutionData(generatedOps, executedOps);

      expect(merged[0].name).toBe('Custom Name');
      expect(merged[0].type).toBe('UNLOADING');
    });

    test('should use generated name when saved operation has no name', () => {
      const generatedOps = [
        {
          operationId: 'OP-005',
          name: 'Generated Name',
          type: 'LOADING',
          status: 'PENDING'
        }
      ];

      const executedOps = [
        {
          operationId: 'OP-005',
          status: 'STARTED',
          startTime: '2026-01-03T08:00:00Z'
        }
      ];

      const merged = mergeOperationsWithExecutionData(generatedOps, executedOps);

      expect(merged[0].name).toBe('Generated Name');
    });

    test('should handle multiple operations with mixed execution states', () => {
      const generatedOps = [
        {
          operationId: 'OP-006',
          name: 'Op 1',
          type: 'WAITING',
          status: 'PENDING'
        },
        {
          operationId: 'OP-007',
          name: 'Op 2',
          type: 'LOADING',
          status: 'PENDING'
        },
        {
          operationId: 'OP-008',
          name: 'Op 3',
          type: 'UNLOADING',
          status: 'PENDING'
        }
      ];

      const executedOps = [
        {
          operationId: 'OP-006',
          status: 'COMPLETED',
          startTime: '2026-01-03T08:00:00Z',
          endTime: '2026-01-03T08:30:00Z'
        },
        {
          operationId: 'OP-007',
          status: 'STARTED',
          startTime: '2026-01-03T08:30:00Z'
        }
      ];

      const merged = mergeOperationsWithExecutionData(generatedOps, executedOps);

      expect(merged).toHaveLength(3);
      expect(merged[0].computedStatus).toBe('COMPLETED');
      expect(merged[1].computedStatus).toBe('STARTED');
      expect(merged[2].computedStatus).toBe('PENDING'); // No execution data
    });

    test('should default notes to empty string when not provided', () => {
      const generatedOps = [
        {
          operationId: 'OP-009',
          name: 'Test',
          type: 'LOADING',
          status: 'PENDING'
        }
      ];

      const executedOps = [
        {
          operationId: 'OP-009',
          status: 'COMPLETED',
          startTime: '2026-01-03T08:00:00Z',
          endTime: '2026-01-03T09:00:00Z'
        }
      ];

      const merged = mergeOperationsWithExecutionData(generatedOps, executedOps);

      expect(merged[0].notes).toBe('');
    });

    test('should preserve notes from saved operation', () => {
      const generatedOps = [
        {
          operationId: 'OP-010',
          name: 'Test',
          type: 'LOADING',
          status: 'PENDING'
        }
      ];

      const executedOps = [
        {
          operationId: 'OP-010',
          status: 'SUSPENDED',
          startTime: '2026-01-03T08:00:00Z',
          notes: 'Weather delay'
        }
      ];

      const merged = mergeOperationsWithExecutionData(generatedOps, executedOps);

      expect(merged[0].notes).toBe('Weather delay');
    });
  });
});

