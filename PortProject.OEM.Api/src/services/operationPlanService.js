import { OperationPlanRepository } from '../infrastructure/repositories/OperationPlanRepository.js';
import { OperationPlanMapper } from '../application/mappers/OperationPlanMapper.js';

export class OperationPlanService {
    // 1. Receber o gateway no construtor
    constructor(masterDataGateway) {
        this.repository = new OperationPlanRepository();
        this.masterDataGateway = masterDataGateway;
    }

    /**
     * Create a new Operation Plan
     */
    async createPlan(dto, userId) {
        // 1. Validate DTO
        const validation = dto.validate();
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        // 2. Generate unique Plan ID
        const planId = await this.repository.generateNextId();

        // 3. Prepare data persistence object
        const planData = {
            planId,
            date: dto.date,
            algorithm: dto.algorithm,
            geneticParams: dto.geneticParams,
            createdBy: userId,
            status: 'Confirmed',
            scheduledTasks: dto.scheduledTasks,
            metrics: {
                totalDelay: dto.totalDelay,
                executionTimeMs: dto.executionTimeMs
            }
        };

        // 4. Save to repository
        const savedPlan = await this.repository.create(planData);

        // 5. Map to response DTO
        return OperationPlanMapper.toResponseDto(savedPlan);
    }

    /**
     * Get all plans
     */
    async getAllPlans(filters = {}) {
        const plans = await this.repository.findAll(filters);
        return OperationPlanMapper.toListDto(plans);
    }
}