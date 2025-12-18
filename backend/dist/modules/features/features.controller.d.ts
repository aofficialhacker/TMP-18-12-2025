import { FeaturesService } from './features.service';
import { CreateFeatureDto } from './dto/create-feature.dto';
import { UpdateFeatureDto } from './dto/update-feature.dto';
import { UpdateFeatureWeightsDto } from './dto/update-weights.dto';
export declare class FeaturesController {
    private readonly featuresService;
    constructor(featuresService: FeaturesService);
    findAll(categoryId?: string, includeInactive?: string): Promise<import("../../entities").Feature[]>;
    validateWeights(categoryId: number): Promise<{
        valid: boolean;
        total: number;
        message: string;
    }>;
    getWeightsByCategory(categoryId: number): Promise<{
        categoryId: number;
        features: {
            id: number;
            name: string;
            weightage: number;
        }[];
        total: number;
        valid: boolean;
    }>;
    findOne(id: number): Promise<import("../../entities").Feature>;
    create(createFeatureDto: CreateFeatureDto): Promise<import("../../entities").Feature>;
    updateWeights(categoryId: number, updateWeightsDto: UpdateFeatureWeightsDto): Promise<import("../../entities").Feature[]>;
    update(id: number, updateFeatureDto: UpdateFeatureDto): Promise<import("../../entities").Feature>;
    remove(id: number): Promise<{
        message: string;
    }>;
}
