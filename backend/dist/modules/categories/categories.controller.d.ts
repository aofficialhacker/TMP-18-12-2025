import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateCategoryWeightsDto } from './dto/update-weights.dto';
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    findAll(includeInactive?: string): Promise<import("../../entities").Category[]>;
    validateWeights(): Promise<{
        valid: boolean;
        total: number;
        message: string;
    }>;
    findOne(id: number): Promise<import("../../entities").Category>;
    create(createCategoryDto: CreateCategoryDto): Promise<import("../../entities").Category>;
    updateWeights(updateWeightsDto: UpdateCategoryWeightsDto): Promise<import("../../entities").Category[]>;
    update(id: number, updateCategoryDto: UpdateCategoryDto): Promise<import("../../entities").Category>;
    remove(id: number): Promise<{
        message: string;
    }>;
}
