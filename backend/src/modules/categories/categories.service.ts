import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  async findAll(includeInactive = false): Promise<Category[]> {
    const where = includeInactive ? {} : { isActive: true };
    return this.categoryRepository.find({
      where,
      relations: ['features'],
      order: { displayOrder: 'ASC', name: 'ASC' },
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

  // ✅ IMPORTANT FIX IS HERE
  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    if (createCategoryDto.isActive) {
      const activeCategories = await this.categoryRepository.find({
        where: { isActive: true },
      });

      const totalActiveWeight = activeCategories.reduce(
        (sum, c) => sum + c.weightage,
        0,
      );

      const newTotal = totalActiveWeight + createCategoryDto.weightage;

      if (newTotal > 100) {
        throw new BadRequestException(
          'Total weight exceeds 100%. Please free up some weight.',
        );
      }
    }

    const category = this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(category);
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);
    Object.assign(category, updateCategoryDto);
    return this.categoryRepository.save(category);
  }

  async remove(id: number): Promise<{ message: string }> {
    const category = await this.findOne(id);
    category.isActive = false;
    await this.categoryRepository.save(category);
    return { message: `Category ${category.name} has been deactivated` };
  }

  async updateWeights(updateWeightsDto: UpdateCategoryWeightsDto): Promise<Category[]> {
    const { categories } = updateWeightsDto;

    const totalWeight = categories.reduce((sum, cat) => sum + cat.weightage, 0);
    if (totalWeight !== 100) {
      throw new BadRequestException(
        `Category weights must sum to 100. Current total: ${totalWeight}`,
      );
    }

    const categoryIds = categories.map((c) => c.id);
    const existingCategories = await this.categoryRepository.find({
      where: categoryIds.map((id) => ({ id, isActive: true })),
    });

    if (existingCategories.length !== categoryIds.length) {
      throw new BadRequestException('One or more categories not found or inactive');
    }

    for (const catWeight of categories) {
      await this.categoryRepository.update(catWeight.id, {
        weightage: catWeight.weightage,
      });
    }

    return this.findAll();
  }

  async getTotalWeight(): Promise<number> {
    const categories = await this.categoryRepository.find({
      where: { isActive: true },
    });
    return categories.reduce((sum, cat) => sum + cat.weightage, 0);
  }

  async validateWeightsSum(): Promise<{ valid: boolean; total: number; message: string }> {
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
