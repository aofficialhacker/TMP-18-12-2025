import { Repository } from 'typeorm';
import { Feature } from '../../entities/feature.entity';
import { Category } from '../../entities/category.entity';
import { CreateFeatureDto } from './dto/create-feature.dto';
import { UpdateFeatureDto } from './dto/update-feature.dto';
import { UpdateFeatureWeightsDto } from './dto/update-weights.dto';
export declare class FeaturesService {
    private readonly featureRepository;
    private readonly categoryRepository;
    constructor(featureRepository: Repository<Feature>, categoryRepository: Repository<Category>);
    findAll(categoryId?: number, includeInactive?: boolean): Promise<Feature[]>;
    findOne(id: number): Promise<Feature>;
    create(dto: CreateFeatureDto): Promise<Feature>;
    update(id: number, dto: UpdateFeatureDto): Promise<Feature>;
    remove(id: number): Promise<{
        message: string;
    }>;
    updateWeights(categoryId: number, dto: UpdateFeatureWeightsDto): Promise<Feature[]>;
    validateWeightsForCategory(categoryId: number): Promise<{
        categoryId: number;
        totalWeight: number;
        isValid: boolean;
    }>;
    getWeightsByCategoryId(categoryId: number): Promise<{
        categoryId: number;
        features: {
            id: number;
            name: string;
            weightage: number;
        }[];
    }>;
    private getMaxDisplayOrder;
    private shiftDisplayOrdersUp;
    private shiftDisplayOrdersDown;
    private getFeatureAtDisplayOrder;
}
