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
    previewOrderShift(categoryId: number, displayOrder: number, newFeatureName: string): Promise<{
        conflict: boolean;
        current: {
            displayOrder: number;
            name: string;
        }[];
        proposed: {
            displayOrder: number;
            name: string;
        }[];
    }>;
    create(createFeatureDto: CreateFeatureDto): Promise<Feature>;
    update(id: number, updateFeatureDto: UpdateFeatureDto): Promise<Feature>;
    remove(id: number): Promise<{
        message: string;
    }>;
    updateWeights(categoryId: number, dto: UpdateFeatureWeightsDto): Promise<Feature[]>;
    getWeightsByCategoryId(categoryId: number): Promise<{
        total: number;
        valid: boolean;
        features: Feature[];
    }>;
    validateWeightsForCategory(categoryId: number): Promise<{
        valid: boolean;
        total: number;
        message: string;
    }>;
}
