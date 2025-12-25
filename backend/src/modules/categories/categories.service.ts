import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { Category } from '../../entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateCategoryWeightsDto } from './dto/update-weights.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  // -------------------- READ --------------------

  async findAll(includeInactive = false): Promise<Category[]> {
    const where = includeInactive ? {} : { isActive: true };
    return this.categoryRepository.find({
      where,
      relations: ['features'],
      order: {
        displayOrder: 'ASC',
        name: 'ASC',
      },
    });
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['features'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  // -------------------- CREATE --------------------

  async create(
    createCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    const category =
      this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(category);
  }

  // -------------------- UPDATE --------------------

  async update(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findOne(id);
    Object.assign(category, updateCategoryDto);
    return this.categoryRepository.save(category);
  }

  // -------------------- SOFT DELETE --------------------

  async remove(id: number): Promise<{ message: string }> {
    const category = await this.findOne(id);
    category.isActive = false;
    await this.categoryRepository.save(category);

    return {
      message: `Category ${category.name} has been deactivated`,
    };
  }

  // -------------------- WEIGHTAGE (FROM VISHAL) --------------------

  async updateWeights(
    updateWeightsDto: UpdateCategoryWeightsDto,
  ): Promise<Category[]> {
    const { categories } = updateWeightsDto;

    // ✅ Validate total = 100
    const totalWeight = categories.reduce(
      (sum, cat) => sum + cat.weightage,
      0,
    );

    if (totalWeight !== 100) {
      throw new BadRequestException(
        `Category weights must sum to 100. Current total: ${totalWeight}`,
      );
    }

    // ✅ Validate all categories exist & active
    const categoryIds = categories.map((c) => c.id);

    const existingCategories =
      await this.categoryRepository.find({
        where: {
          id: In(categoryIds),
          isActive: true,
        },
      });

    if (existingCategories.length !== categoryIds.length) {
      throw new BadRequestException(
        'One or more categories not found or inactive',
      );
    }

    // ✅ Update weights
    for (const cat of categories) {
      await this.categoryRepository.update(cat.id, {
        weightage: cat.weightage,
      });
    }

    return this.findAll();
  }

  // -------------------- VALIDATION HELPERS (FROM VISHAL) --------------------

  async getTotalWeight(): Promise<number> {
    const categories = await this.categoryRepository.find({
      where: { isActive: true },
    });

    return categories.reduce(
      (sum, cat) => sum + cat.weightage,
      0,
    );
  }

  async validateWeightsSum(): Promise<{
    valid: boolean;
    total: number;
    message: string;
  }> {
    const total = await this.getTotalWeight();
    const valid = total === 100;

    return {
      valid,
      total,
      message: valid
        ? 'Category weights are valid (sum = 100)'
        : `Category weights must sum to 100. Current total: ${total}`,
    };
  }
}
