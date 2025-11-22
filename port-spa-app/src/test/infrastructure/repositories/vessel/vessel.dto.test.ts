import { describe, it, expect } from 'vitest';
import type {
    CreateVesselDto,
    UpdateVesselDto
} from '../../../../infrastructure/repositories/vessel/vessel.dto';

describe('Vessel DTOs', () => {
    describe('CreateVesselDto', () => {
        it('should have correct structure', () => {
            const dto: CreateVesselDto = {
                imoNumber: 'IMO1234567',
                name: 'Cargo Ship Alpha',
                operator: 'Maritime Transport Co.',
                vesselTypeId: 'vtype-001'
            };

            expect(dto).toHaveProperty('imoNumber');
            expect(dto).toHaveProperty('name');
            expect(dto).toHaveProperty('operator');
            expect(dto).toHaveProperty('vesselTypeId');
            expect(typeof dto.imoNumber).toBe('string');
            expect(typeof dto.name).toBe('string');
            expect(typeof dto.operator).toBe('string');
            expect(typeof dto.vesselTypeId).toBe('string');
        });

        it('should accept various IMO numbers', () => {
            const imoNumbers = [
                'IMO1234567',
                'IMO9876543',
                'IMO1111111',
                'IMO9999999',
                'IMO5555555'
            ];

            imoNumbers.forEach(imo => {
                const dto: CreateVesselDto = {
                    imoNumber: imo,
                    name: 'Test Vessel',
                    operator: 'Test Operator',
                    vesselTypeId: 'vtype-001'
                };
                expect(dto.imoNumber).toBe(imo);
            });
        });

        it('should accept various vessel names', () => {
            const names = [
                'Cargo Ship Alpha',
                'Container Vessel Beta',
                'Bulk Carrier Delta',
                'Oil Tanker Gamma',
                'Passenger Ship Omega'
            ];

            names.forEach(name => {
                const dto: CreateVesselDto = {
                    imoNumber: 'IMO1234567',
                    name,
                    operator: 'Test Operator',
                    vesselTypeId: 'vtype-001'
                };
                expect(dto.name).toBe(name);
            });
        });

        it('should accept various operators', () => {
            const operators = [
                'Maritime Transport Co.',
                'Global Shipping Lines',
                'Ocean Freight Inc.',
                'SeaWay Logistics',
                'Pacific Marine Services'
            ];

            operators.forEach(operator => {
                const dto: CreateVesselDto = {
                    imoNumber: 'IMO1234567',
                    name: 'Test Vessel',
                    operator,
                    vesselTypeId: 'vtype-001'
                };
                expect(dto.operator).toBe(operator);
            });
        });

        it('should accept various vessel type IDs', () => {
            const vesselTypeIds = [
                'vtype-001',
                'vtype-002',
                '550e8400-e29b-41d4-a716-446655440000',
                'container-ship',
                'bulk-carrier'
            ];

            vesselTypeIds.forEach(vesselTypeId => {
                const dto: CreateVesselDto = {
                    imoNumber: 'IMO1234567',
                    name: 'Test Vessel',
                    operator: 'Test Operator',
                    vesselTypeId
                };
                expect(dto.vesselTypeId).toBe(vesselTypeId);
            });
        });

        it('should accept special characters in vessel name', () => {
            const dto: CreateVesselDto = {
                imoNumber: 'IMO1234567',
                name: 'Vessel "Special" & Co. - Edition #1',
                operator: 'Test Operator',
                vesselTypeId: 'vtype-001'
            };

            expect(dto.name).toContain('"Special"');
            expect(dto.name).toContain('&');
            expect(dto.name).toContain('#');
        });

        it('should accept special characters in operator name', () => {
            const dto: CreateVesselDto = {
                imoNumber: 'IMO1234567',
                name: 'Test Vessel',
                operator: "O'Brien Maritime Ltd. & Co.",
                vesselTypeId: 'vtype-001'
            };

            expect(dto.operator).toContain("O'Brien");
            expect(dto.operator).toContain('&');
        });

        it('should accept vessel type ID with UUID format', () => {
            const dto: CreateVesselDto = {
                imoNumber: 'IMO1234567',
                name: 'Test Vessel',
                operator: 'Test Operator',
                vesselTypeId: '550e8400-e29b-41d4-a716-446655440000'
            };

            expect(dto.vesselTypeId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        });

        it('should support multiple distinct vessels', () => {
            const dto1: CreateVesselDto = {
                imoNumber: 'IMO1111111',
                name: 'First Vessel',
                operator: 'First Operator',
                vesselTypeId: 'vtype-001'
            };

            const dto2: CreateVesselDto = {
                imoNumber: 'IMO2222222',
                name: 'Second Vessel',
                operator: 'Second Operator',
                vesselTypeId: 'vtype-002'
            };

            expect(dto1.imoNumber).not.toBe(dto2.imoNumber);
            expect(dto1.name).not.toBe(dto2.name);
            expect(dto1.operator).not.toBe(dto2.operator);
            expect(dto1.vesselTypeId).not.toBe(dto2.vesselTypeId);
        });

        it('should accept long vessel names', () => {
            const longName = 'Very Long Container Ship Name With Multiple Words And Details About Its Purpose And Origin';

            const dto: CreateVesselDto = {
                imoNumber: 'IMO1234567',
                name: longName,
                operator: 'Test Operator',
                vesselTypeId: 'vtype-001'
            };

            expect(dto.name).toBe(longName);
            expect(dto.name.length).toBeGreaterThan(50);
        });

        it('should accept long operator names', () => {
            const longOperator = 'International Maritime Transportation and Logistics Corporation Limited Company';

            const dto: CreateVesselDto = {
                imoNumber: 'IMO1234567',
                name: 'Test Vessel',
                operator: longOperator,
                vesselTypeId: 'vtype-001'
            };

            expect(dto.operator).toBe(longOperator);
            expect(dto.operator.length).toBeGreaterThan(50);
        });
    });

    describe('UpdateVesselDto', () => {
        it('should allow all fields to be optional', () => {
            const dto: UpdateVesselDto = {};

            expect(Object.keys(dto).length).toBe(0);
        });

        it('should accept only name update', () => {
            const dto: UpdateVesselDto = {
                name: 'Updated Vessel Name'
            };

            expect(dto).toHaveProperty('name');
            expect(dto.name).toBe('Updated Vessel Name');
            expect(dto.operator).toBeUndefined();
            expect(dto.vesselTypeId).toBeUndefined();
        });

        it('should accept only operator update', () => {
            const dto: UpdateVesselDto = {
                operator: 'Updated Operator Company'
            };

            expect(dto).toHaveProperty('operator');
            expect(dto.operator).toBe('Updated Operator Company');
            expect(dto.name).toBeUndefined();
            expect(dto.vesselTypeId).toBeUndefined();
        });

        it('should accept only vessel type ID update', () => {
            const dto: UpdateVesselDto = {
                vesselTypeId: 'vtype-999'
            };

            expect(dto).toHaveProperty('vesselTypeId');
            expect(dto.vesselTypeId).toBe('vtype-999');
            expect(dto.name).toBeUndefined();
            expect(dto.operator).toBeUndefined();
        });

        it('should accept multiple fields update', () => {
            const dto: UpdateVesselDto = {
                name: 'Updated Name',
                operator: 'Updated Operator'
            };

            expect(dto.name).toBe('Updated Name');
            expect(dto.operator).toBe('Updated Operator');
            expect(dto.vesselTypeId).toBeUndefined();
        });

        it('should accept all fields update', () => {
            const dto: UpdateVesselDto = {
                name: 'Completely Updated Vessel',
                operator: 'Completely Updated Operator',
                vesselTypeId: 'vtype-updated'
            };

            expect(dto.name).toBe('Completely Updated Vessel');
            expect(dto.operator).toBe('Completely Updated Operator');
            expect(dto.vesselTypeId).toBe('vtype-updated');
        });

        it('should accept special characters in updated name', () => {
            const dto: UpdateVesselDto = {
                name: 'Updated "Special" Vessel & Co.'
            };

            expect(dto.name).toContain('"Special"');
            expect(dto.name).toContain('&');
        });

        it('should accept special characters in updated operator', () => {
            const dto: UpdateVesselDto = {
                operator: "O'Connor Maritime & Logistics Ltd."
            };

            expect(dto.operator).toContain("O'Connor");
            expect(dto.operator).toContain('&');
        });

        it('should support updating to different vessel types', () => {
            const vesselTypeIds = [
                'vtype-001',
                'vtype-002',
                '550e8400-e29b-41d4-a716-446655440000',
                'container-ship',
                'tanker'
            ];

            vesselTypeIds.forEach(vesselTypeId => {
                const dto: UpdateVesselDto = {
                    vesselTypeId
                };
                expect(dto.vesselTypeId).toBe(vesselTypeId);
            });
        });

        it('should accept long updated names', () => {
            const longName = 'Very Long Updated Container Ship Name With Multiple Words And Extended Description';

            const dto: UpdateVesselDto = {
                name: longName
            };

            expect(dto.name).toBe(longName);
            expect(dto.name!.length).toBeGreaterThan(50);
        });

        it('should handle partial updates independently', () => {
            const dto1: UpdateVesselDto = {
                name: 'Only Name Updated'
            };

            const dto2: UpdateVesselDto = {
                operator: 'Only Operator Updated'
            };

            const dto3: UpdateVesselDto = {
                vesselTypeId: 'vtype-only-type-updated'
            };

            expect(dto1.name).toBeDefined();
            expect(dto1.operator).toBeUndefined();
            expect(dto1.vesselTypeId).toBeUndefined();

            expect(dto2.name).toBeUndefined();
            expect(dto2.operator).toBeDefined();
            expect(dto2.vesselTypeId).toBeUndefined();

            expect(dto3.name).toBeUndefined();
            expect(dto3.operator).toBeUndefined();
            expect(dto3.vesselTypeId).toBeDefined();
        });
    });
});

