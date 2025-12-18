import { Repository } from 'typeorm';
import { Category } from '../../entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateCategoryWeightsDto } from './dto/update-weights.dto';
export declare class CategoriesService {
    private readonly categoryRepository;
    constructor(categoryRepository: Repository<Category>);
    findAll(includeInactive?: boolean): Promise<Category[]>;
    findOne(id: number): Promise<Category>;
    create(createCategoryDto: CreateCategoryDto): Promise<Category>;
    update(id: number, updateCategoryDto: UpdateCategoryDto): Promise<Category>;
    remove(id: number): Promise<{
        message: string;
    }>;
    updateWeights(updateWeightsDto: UpdateCategoryWeightsDto): Promise<Category[]>;
    getTotalWeight(): Promise<number>;
    validateWeightsSum(): Promise<{
        valid: boolean;
        total: number;
        message: string;
    }>;
}
