/**
 * Unit Tests for VveDto
 * 
 * Type: Functional Black-Box Testing with SUT = class
 * Goal: Test DTO instantiation, property assignment, and validation logic
 * Tool: Jest
 */

import { 
  CreateVveDto, 
  UpdateVveDto, 
  VveResponseDto, 
  VveListItemDto,
  VveStatisticsDto 
} from '../../../src/application/dtos/VveDto.js';

describe('Unit Test - VveDto', () => {
  
  describe('CreateVveDto', () => {
    test('should correctly assign all properties with valid data', () => {
      const data = {
        vvnId: 'VVN-20260103-001',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: '2026-01-03T08:00:00Z',
        notes: 'Test notes',
        generateInitialOperations: true
      };
      
      const dto = new CreateVveDto(data);
      
      expect(dto.vvnId).toBe('VVN-20260103-001');
      expect(dto.vesselIdentifier).toBe('IMO1234567');
      expect(dto.actualArrivalTime).toBe('2026-01-03T08:00:00Z');
      expect(dto.notes).toBe('Test notes');
      expect(dto.generateInitialOperations).toBe(true);
    });

    test('should default notes to empty string and generateInitialOperations to false', () => {
      const data = {
        vvnId: 'VVN-20260103-001',
        vesselIdentifier: 'IMO1234567',
        actualArrivalTime: '2026-01-03T08:00:00Z'
      };
      
      const dto = new CreateVveDto(data);
      
      expect(dto.notes).toBe('');
      expect(dto.generateInitialOperations).toBe(false);
    });

    describe('validate()', () => {
      test('should pass validation with valid data', () => {
        const dto = new CreateVveDto({
          vvnId: 'VVN-20260103-001',
          vesselIdentifier: 'IMO1234567',
          actualArrivalTime: '2026-01-03T08:00:00Z'
        });
        
        const result = dto.validate();
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });

      test('should fail validation when vvnId is missing', () => {
        const dto = new CreateVveDto({
          vvnId: '',
          vesselIdentifier: 'IMO1234567',
          actualArrivalTime: '2026-01-03T08:00:00Z'
        });
        
        const result = dto.validate();
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('VVN ID is required');
      });

      test('should fail validation when vvnId is only whitespace', () => {
        const dto = new CreateVveDto({
          vvnId: '   ',
          vesselIdentifier: 'IMO1234567',
          actualArrivalTime: '2026-01-03T08:00:00Z'
        });
        
        const result = dto.validate();
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('VVN ID is required');
      });

      test('should fail validation when vesselIdentifier is missing', () => {
        const dto = new CreateVveDto({
          vvnId: 'VVN-20260103-001',
          vesselIdentifier: '',
          actualArrivalTime: '2026-01-03T08:00:00Z'
        });
        
        const result = dto.validate();
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Vessel identifier is required');
      });

      test('should fail validation when actualArrivalTime is missing', () => {
        const dto = new CreateVveDto({
          vvnId: 'VVN-20260103-001',
          vesselIdentifier: 'IMO1234567',
          actualArrivalTime: null
        });
        
        const result = dto.validate();
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Actual arrival time is required');
      });

      test('should fail validation when actualArrivalTime has invalid format', () => {
        const dto = new CreateVveDto({
          vvnId: 'VVN-20260103-001',
          vesselIdentifier: 'IMO1234567',
          actualArrivalTime: 'invalid-date'
        });
        
        const result = dto.validate();
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Invalid arrival time format');
      });

      test('should return multiple errors when multiple validations fail', () => {
        const dto = new CreateVveDto({
          vvnId: '',
          vesselIdentifier: '',
          actualArrivalTime: 'invalid'
        });
        
        const result = dto.validate();
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(3);
        expect(result.errors).toContain('VVN ID is required');
        expect(result.errors).toContain('Vessel identifier is required');
        expect(result.errors).toContain('Invalid arrival time format');
      });
    });
  });

  describe('UpdateVveDto', () => {
    test('should correctly assign all properties', () => {
      const data = {
        status: 'Completed',
        actualDepartureTime: '2026-01-03T18:00:00Z',
        actualBerthTime: '2026-01-03T09:00:00Z',
        berthDockId: 'DOCK-A1',
        notes: 'Updated notes'
      };
      
      const dto = new UpdateVveDto(data);
      
      expect(dto.status).toBe('Completed');
      expect(dto.actualDepartureTime).toBe('2026-01-03T18:00:00Z');
      expect(dto.actualBerthTime).toBe('2026-01-03T09:00:00Z');
      expect(dto.berthDockId).toBe('DOCK-A1');
      expect(dto.notes).toBe('Updated notes');
    });

    test('should handle partial updates with only some properties', () => {
      const dto = new UpdateVveDto({ status: 'Completed' });
      
      expect(dto.status).toBe('Completed');
      expect(dto.actualDepartureTime).toBeUndefined();
      expect(dto.notes).toBeUndefined();
    });

    describe('validate()', () => {
      test('should pass validation with valid status', () => {
        const dto = new UpdateVveDto({ status: 'In Progress' });
        
        const result = dto.validate();
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });

      test('should pass validation when no fields are provided', () => {
        const dto = new UpdateVveDto({});
        
        const result = dto.validate();
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });

      test('should fail validation with invalid status', () => {
        const dto = new UpdateVveDto({ status: 'Invalid Status' });
        
        const result = dto.validate();
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Invalid status. Must be one of: In Progress, Completed, Cancelled');
      });

      test('should pass validation with valid status values', () => {
        const statuses = ['In Progress', 'Completed', 'Cancelled'];
        
        statuses.forEach(status => {
          const dto = new UpdateVveDto({ status });
          const result = dto.validate();
          
          expect(result.isValid).toBe(true);
        });
      });

      test('should fail validation when actualDepartureTime has invalid format', () => {
        const dto = new UpdateVveDto({ 
          actualDepartureTime: 'not-a-date' 
        });
        
        const result = dto.validate();
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Invalid departure time format');
      });

      test('should fail validation when actualBerthTime has invalid format', () => {
        const dto = new UpdateVveDto({ 
          actualBerthTime: 'not-a-date' 
        });
        
        const result = dto.validate();
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Invalid berth time format');
      });

      test('should fail validation when berthDockId is not a string', () => {
        const dto = new UpdateVveDto({ 
          berthDockId: 12345 
        });
        
        const result = dto.validate();
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Berth dock ID must be a string');
      });

      test('should pass validation with valid date formats', () => {
        const dto = new UpdateVveDto({ 
          actualDepartureTime: '2026-01-03T18:00:00Z',
          actualBerthTime: '2026-01-03T09:00:00Z'
        });
        
        const result = dto.validate();
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });

      test('should return multiple errors when multiple validations fail', () => {
        const dto = new UpdateVveDto({ 
          status: 'Invalid',
          actualDepartureTime: 'bad-date',
          actualBerthTime: 'bad-date',
          berthDockId: 999
        });
        
        const result = dto.validate();
        
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(1);
      });
    });
  });

  describe('VveResponseDto', () => {
    test('should correctly assign all properties', () => {
      const now = new Date();
      const data = {
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
        createdAt: now,
        updatedAt: now,
        auditLogs: [{ action: 'created', timestamp: now }],
        executedOperations: [{ operationId: 'OP-001', status: 'PENDING' }]
      };
      
      const dto = new VveResponseDto(data);
      
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
      expect(dto.createdAt).toBe(now);
      expect(dto.updatedAt).toBe(now);
      expect(dto.auditLogs).toHaveLength(1);
      expect(dto.executedOperations).toHaveLength(1);
    });

    test('should default auditLogs and executedOperations to empty arrays', () => {
      const dto = new VveResponseDto({
        vveId: 'VVE-20260103-001',
        vvnId: 'VVN-20260103-001',
        vesselIdentifier: 'IMO1234567',
        status: 'In Progress'
      });
      
      expect(dto.auditLogs).toEqual([]);
      expect(dto.executedOperations).toEqual([]);
    });
  });

  describe('VveListItemDto', () => {
    test('should correctly assign all properties', () => {
      const now = new Date();
      const data = {
        vveId: 'VVE-20260103-001',
        vvnId: 'VVN-20260103-001',
        vesselIdentifier: 'IMO1234567',
        status: 'In Progress',
        actualArrivalTime: now,
        createdAt: now,
        creatorEmail: 'test@example.com'
      };
      
      const dto = new VveListItemDto(data);
      
      expect(dto.vveId).toBe('VVE-20260103-001');
      expect(dto.vvnId).toBe('VVN-20260103-001');
      expect(dto.vesselIdentifier).toBe('IMO1234567');
      expect(dto.status).toBe('In Progress');
      expect(dto.actualArrivalTime).toBe(now);
      expect(dto.createdAt).toBe(now);
      expect(dto.creatorEmail).toBe('test@example.com');
    });

    test('should handle minimal properties for list display', () => {
      const dto = new VveListItemDto({
        vveId: 'VVE-20260103-001',
        vvnId: 'VVN-20260103-001',
        vesselIdentifier: 'IMO1234567',
        status: 'Completed'
      });
      
      expect(dto.vveId).toBe('VVE-20260103-001');
      expect(dto.status).toBe('Completed');
    });
  });

  describe('VveStatisticsDto', () => {
    test('should correctly assign all statistics properties', () => {
      const data = {
        total: 100,
        inProgress: 45,
        completed: 50,
        cancelled: 5
      };
      
      const dto = new VveStatisticsDto(data);
      
      expect(dto.total).toBe(100);
      expect(dto.inProgress).toBe(45);
      expect(dto.completed).toBe(50);
      expect(dto.cancelled).toBe(5);
    });

    test('should handle zero values', () => {
      const data = {
        total: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0
      };
      
      const dto = new VveStatisticsDto(data);
      
      expect(dto.total).toBe(0);
      expect(dto.inProgress).toBe(0);
      expect(dto.completed).toBe(0);
      expect(dto.cancelled).toBe(0);
    });

    test('should correctly sum up status counts', () => {
      const data = {
        total: 25,
        inProgress: 10,
        completed: 12,
        cancelled: 3
      };
      
      const dto = new VveStatisticsDto(data);
      const sum = dto.inProgress + dto.completed + dto.cancelled;
      
      expect(sum).toBe(dto.total);
    });
  });
});

