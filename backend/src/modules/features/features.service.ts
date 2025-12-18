import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feature } from '../../entities/feature.entity';
import { Category } from '../../entities/category.entity';
import { CreateFeatureDto } from './dto/create-feature.dto';
import { UpdateFeatureDto } from './dto/update-feature.dto';
import { UpdateFeatureWeightsDto } from './dto/update-weights.dto';

@Injectable()
export class FeaturesService {
  constructor(
    @InjectRepository(Feature)
    private readonly featureRepository: Repository<Feature>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async findAll(categoryId?: number, includeInactive = false): Promise<Feature[]> {
    const where: any = includeInactive ? {} : { isActive: true };
    if (categoryId) {
      where.categoryId = categoryId;
    }
    return this.featureRepository.find({
      where,
      relations: ['category'],
      order: { displayOrder: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Feature> {
    const feature = await this.featureRepository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!feature) {
      throw new NotFoundException(`Feature with ID ${id} not found`);
    }

    return feature;
  }

  async create(createFeatureDto: CreateFeatureDto): Promise<Feature> {
    // Verify category exists
    const category = await this.categoryRepository.findOne({
      where: { id: createFeatureDto.categoryId, isActive: true },
    });

    if (!category) {
      throw new NotFoundException(
        `Category with ID ${createFeatureDto.categoryId} not found or inactive`,
      );
    }

    const feature = this.featureRepository.create({
      ...createFeatureDto,
      extractionKeywords: createFeatureDto.extractionKeywords
        ? JSON.stringify(createFeatureDto.extractionKeywords)
        : null,
    });

    return this.featureRepository.save(feature);
  }

  async update(id: number, updateFeatureDto: UpdateFeatureDto): Promise<Feature> {
    const feature = await this.findOne(id);

    if (updateFeatureDto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: updateFeatureDto.categoryId, isActive: true },
      });
      if (!category) {
        throw new NotFoundException(
          `Category with ID ${updateFeatureDto.categoryId} not found or inactive`,
        );
      }
    }

    const updateData: any = { ...updateFeatureDto };
    if (updateFeatureDto.extractionKeywords) {
      updateData.extractionKeywords = JSON.stringify(updateFeatureDto.extractionKeywords);
    }

    Object.assign(feature, updateData);
    return this.featureRepository.save(feature);
  }

  async remove(id: number): Promise<{ message: string }> {
    const feature = await this.findOne(id);
    feature.isActive = false;
    await this.featureRepository.save(feature);
    return { message: `Feature ${feature.name} has been deactivated` };
  }

  async updateWeights(
    categoryId: number,
    updateWeightsDto: UpdateFeatureWeightsDto,
  ): Promise<Feature[]> {
    const { features } = updateWeightsDto;

    // Validate that weights sum to 100
    const totalWeight = features.reduce((sum, feat) => sum + feat.weightage, 0);
    if (totalWeight !== 100) {
      throw new BadRequestException(
        `Feature weights within category must sum to 100. Current total: ${totalWeight}`,
      );
    }

    // Verify all features exist, are active, and belong to the category
    const featureIds = features.map((f) => f.id);
    const existingFeatures = await this.featureRepository.find({
      where: featureIds.map((id) => ({ id, categoryId, isActive: true })),
    });

    if (existingFeatures.length !== featureIds.length) {
      throw new BadRequestException(
        'One or more features not found, inactive, or do not belong to this category',
      );
    }

    // Update weights
    for (const featWeight of features) {
      await this.featureRepository.update(featWeight.id, {
        weightage: featWeight.weightage,
      });
    }

    return this.findAll(categoryId);
  }

  async getWeightsByCategoryId(categoryId: number): Promise<{
    categoryId: number;
    features: { id: number; name: string; weightage: number }[];
    total: number;
    valid: boolean;
  }> {
    const features = await this.featureRepository.find({
      where: { categoryId, isActive: true },
    });

    const total = features.reduce((sum, f) => sum + f.weightage, 0);

    return {
      categoryId,
      features: features.map((f) => ({
        id: f.id,
        name: f.name,
        weightage: f.weightage,
      })),
      total,
      valid: total === 100,
    };
  }

  async validateWeightsForCategory(categoryId: number): Promise<{
    valid: boolean;
    total: number;
    message: string;
  }> {
    const result = await this.getWeightsByCategoryId(categoryId);
    return {
      valid: result.valid,
      total: result.total,
      message: result.valid
        ? 'Feature weights are valid (sum = 100)'
        : `Feature weights for category must sum to 100. Current total: ${result.total}`,
    };
  }
}
