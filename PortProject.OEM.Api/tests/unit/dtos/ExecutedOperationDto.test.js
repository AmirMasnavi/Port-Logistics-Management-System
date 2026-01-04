/**
 * Unit Tests for ExecutedOperationDto
 * 
 * Type: Functional Black-Box Testing with SUT = class
 * Goal: Test DTO instantiation, property assignment, and validation logic
 * Tool: Jest
 */

import {
  UpdateOperationStatusDto,
  ExecutedOperationResponseDto,
  OperationComparisonDto
} from '../../../src/application/dtos/ExecutedOperationDto.js';

describe('Unit Test - ExecutedOperationDto', () => {
  
  describe('UpdateOperationStatusDto', () => {
    test('should correctly assign all properties with valid data', () => {
      const data = {
        operationId: 'OP-001',
        status: 'STARTED',
        timestamp: '2026-01-03T08:00:00Z',
        operatorId: 'USR-123',
        resourceId: 'RES-456',
        name: 'Loading Operation',
        type: 'Loading',
        notes: 'Test notes'
      };
      
      const dto = new UpdateOperationStatusDto(data);
      
      expect(dto.operationId).toBe('OP-001');
      expect(dto.status).toBe('STARTED');
      expect(dto.timestamp).toBeInstanceOf(Date);
      expect(dto.operatorId).toBe('USR-123');
      expect(dto.resourceId).toBe('RES-456');
      expect(dto.name).toBe('Loading Operation');
      expect(dto.type).toBe('Loading');
      expect(dto.notes).toBe('Test notes');
    });

    test('should use default values for optional fields', () => {
      const data = {
        operationId: 'OP-001',
        status: 'STARTED',
        operatorId: 'USR-123'
      };
      
      const dto = new UpdateOperationStatusDto(data);
      
      expect(dto.timestamp).toBeInstanceOf(Date);
      expect(dto.name).toBe('');
      expect(dto.type).toBe('Other');
      expect(dto.notes).toBe('');
    });

    test('should use current date when timestamp is not provided', () => {
      const beforeCreation = new Date();
      const dto = new UpdateOperationStatusDto({
        operationId: 'OP-001',
        status: 'STARTED',
        operatorId: 'USR-123'
      });
      const afterCreation = new Date();
      
      expect(dto.timestamp.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(dto.timestamp.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });

    describe('validate()', () => {
      test('should pass validation with valid data', () => {
        const dto = new UpdateOperationStatusDto({
          operationId: 'OP-001',
          status: 'STARTED',
          operatorId: 'USR-123'
        });
        
        const result = dto.validate();
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });

      test('should fail validation when operationId is missing', () => {
        const dto = new UpdateOperationStatusDto({
          operationId: '',
          status: 'STARTED',
          operatorId: 'USR-123'
        });
        
        const result = dto.validate();
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Operation ID is required');
      });

      test('should fail validation when operationId is only whitespace', () => {
        const dto = new UpdateOperationStatusDto({
          operationId: '   ',
          status: 'STARTED',
          operatorId: 'USR-123'
        });
        
        const result = dto.validate();
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Operation ID is required');
      });

      test('should fail validation when status is missing', () => {
        const dto = new UpdateOperationStatusDto({
          operationId: 'OP-001',
          status: '',
          operatorId: 'USR-123'
        });
        
        const result = dto.validate();
        
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0]).toContain('Status must be one of');
      });

      test('should fail validation with invalid status', () => {
        const dto = new UpdateOperationStatusDto({
          operationId: 'OP-001',
          status: 'INVALID_STATUS',
          operatorId: 'USR-123'
        });
        
        const result = dto.validate();
        
        expect(result.isValid).toBe(false);
        expect(result.errors[0]).toContain('Status must be one of');
        expect(result.errors[0]).toContain('PENDING');
        expect(result.errors[0]).toContain('STARTED');
        expect(result.errors[0]).toContain('COMPLETED');
        expect(result.errors[0]).toContain('SUSPENDED');
      });

      test('should fail validation when operatorId is missing', () => {
        const dto = new UpdateOperationStatusDto({
          operationId: 'OP-001',
          status: 'STARTED',
          operatorId: ''
        });
        
        const result = dto.validate();
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Operator ID is required');
      });

      test('should fail validation when operatorId is only whitespace', () => {
        const dto = new UpdateOperationStatusDto({
          operationId: 'OP-001',
          status: 'STARTED',
          operatorId: '   '
        });
        
        const result = dto.validate();
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Operator ID is required');
      });

      test('should fail validation with invalid timestamp format', () => {
        const dto = new UpdateOperationStatusDto({
          operationId: 'OP-001',
          status: 'STARTED',
          operatorId: 'USR-123',
          timestamp: 'invalid-date'
        });
        
        const result = dto.validate();
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Invalid timestamp format');
      });

      test('should accumulate multiple validation errors', () => {
        const dto = new UpdateOperationStatusDto({
          operationId: '',
          status: 'INVALID',
          operatorId: ''
        });
        
        const result = dto.validate();
        
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThanOrEqual(3);
      });

      test('should accept all valid statuses', () => {
        const validStatuses = ['PENDING', 'STARTED', 'COMPLETED', 'SUSPENDED'];
        
        validStatuses.forEach(status => {
          const dto = new UpdateOperationStatusDto({
            operationId: 'OP-001',
            status: status,
            operatorId: 'USR-123'
          });
          
          const result = dto.validate();
          
          expect(result.isValid).toBe(true);
          expect(result.errors).toEqual([]);
        });
      });
    });
  });

  describe('ExecutedOperationResponseDto', () => {
    test('should correctly assign all properties', () => {
      const data = {
        operationId: 'OP-001',
        status: 'COMPLETED',
        startTime: new Date('2026-01-03T08:00:00Z'),
        startedBy: 'USR-123',
        endTime: new Date('2026-01-03T10:00:00Z'),
        completedBy: 'USR-123',
        actualResource: 'RES-456',
        notes: 'Operation completed successfully'
      };
      
      const dto = new ExecutedOperationResponseDto(data);
      
      expect(dto.operationId).toBe('OP-001');
      expect(dto.status).toBe('COMPLETED');
      expect(dto.startTime).toEqual(data.startTime);
      expect(dto.startedBy).toBe('USR-123');
      expect(dto.endTime).toEqual(data.endTime);
      expect(dto.completedBy).toBe('USR-123');
      expect(dto.actualResource).toBe('RES-456');
      expect(dto.notes).toBe('Operation completed successfully');
    });

    test('should handle partial data', () => {
      const data = {
        operationId: 'OP-001',
        status: 'STARTED',
        startTime: new Date('2026-01-03T08:00:00Z'),
        startedBy: 'USR-123'
      };
      
      const dto = new ExecutedOperationResponseDto(data);
      
      expect(dto.operationId).toBe('OP-001');
      expect(dto.status).toBe('STARTED');
      expect(dto.startTime).toEqual(data.startTime);
      expect(dto.startedBy).toBe('USR-123');
      expect(dto.endTime).toBeUndefined();
      expect(dto.completedBy).toBeUndefined();
    });
  });

  describe('OperationComparisonDto', () => {
    test('should correctly assign all properties', () => {
      const data = {
        operationId: 'OP-001',
        name: 'Loading Operation',
        type: 'Loading',
        plannedStartTime: new Date('2026-01-03T08:00:00Z'),
        plannedEndTime: new Date('2026-01-03T10:00:00Z'),
        plannedResource: 'RES-001',
        plannedStaff: 'STAFF-001',
        vesselVisitId: 'VV-001',
        vesselImo: 'IMO1234567',
        dockName: 'Dock A',
        executedStatus: 'COMPLETED',
        actualStartTime: new Date('2026-01-03T08:15:00Z'),
        actualEndTime: new Date('2026-01-03T10:20:00Z'),
        startedBy: 'USR-123',
        completedBy: 'USR-123',
        actualResource: 'RES-001',
        computedStatus: 'Delayed',
        delayMinutes: 15,
        notes: 'Delayed start due to weather'
      };
      
      const dto = new OperationComparisonDto(data);
      
      expect(dto.name).toBe('Loading Operation');
      expect(dto.type).toBe('Loading');
      expect(dto.plannedStartTime).toEqual(data.plannedStartTime);
      expect(dto.plannedEndTime).toEqual(data.plannedEndTime);
      expect(dto.actualStartTime).toEqual(data.actualStartTime);
      expect(dto.actualEndTime).toEqual(data.actualEndTime);
      expect(dto.delayMinutes).toBe(15);
      expect(dto.notes).toBe('Delayed start due to weather');
    });

    test('should use default values for optional fields', () => {
      const data = {
        operationId: 'OP-001'
      };
      
      const dto = new OperationComparisonDto(data);
      
      expect(dto.name).toBe('');
      expect(dto.type).toBe('Other');
    });

    test('should handle missing delay information', () => {
      const data = {
        operationId: 'OP-001',
        name: 'Loading Operation',
        type: 'Loading',
        plannedStartTime: new Date('2026-01-03T08:00:00Z'),
        plannedEndTime: new Date('2026-01-03T10:00:00Z'),
        executedStatus: 'PENDING'
      };
      
      const dto = new OperationComparisonDto(data);
      
      expect(dto.operationId).toBe('OP-001');
      expect(dto.delayMinutes).toBeUndefined();
      expect(dto.computedStatus).toBeUndefined();
    });
  });
});

