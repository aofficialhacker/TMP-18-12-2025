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

    // Handle display order
    let displayOrder = createFeatureDto.displayOrder;

    if (displayOrder === undefined || displayOrder === null) {
      // Auto-assign to end
      const maxOrder = await this.getMaxDisplayOrder();
      displayOrder = maxOrder + 1;
    } else {
      // Check if the display order is already occupied
      const existingFeature = await this.getFeatureAtDisplayOrder(displayOrder);
      if (existingFeature) {
        // Shift all features at this position and above
        await this.shiftDisplayOrdersUp(displayOrder);
      }
    }

    const feature = this.featureRepository.create({
      ...createFeatureDto,
      displayOrder,
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

    // Handle display order changes
    if (
      updateFeatureDto.displayOrder !== undefined &&
      updateFeatureDto.displayOrder !== feature.displayOrder
    ) {
      const oldDisplayOrder = feature.displayOrder;
      const newDisplayOrder = updateFeatureDto.displayOrder;

      // Check if the new display order is occupied by another feature
      const existingFeature = await this.getFeatureAtDisplayOrder(
        newDisplayOrder,
        id,
      );
      if (existingFeature) {
        // Shift features at the new position and above to make room
        await this.shiftDisplayOrdersUp(newDisplayOrder, id);
      }

      // Fill the gap at the old position by shifting down
      await this.shiftDisplayOrdersDown(oldDisplayOrder);
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

  // Helper methods for display order management
  private async getMaxDisplayOrder(): Promise<number> {
    const result = await this.featureRepository
      .createQueryBuilder('feature')
      .select('MAX(feature.displayOrder)', 'max')
      .getRawOne();
    return result?.max || 0;
  }

  private async shiftDisplayOrdersUp(
    fromOrder: number,
    excludeId?: number,
  ): Promise<void> {
    // Fetch all features that need to be shifted, ordered DESC to avoid unique constraint conflicts
    const queryBuilder = this.featureRepository
      .createQueryBuilder('feature')
      .where('feature.displayOrder >= :fromOrder', { fromOrder })
      .orderBy('feature.displayOrder', 'DESC');

    if (excludeId) {
      queryBuilder.andWhere('feature.id != :excludeId', { excludeId });
    }

    const features = await queryBuilder.getMany();

    // Update each feature individually from highest to lowest to avoid conflicts
    for (const feature of features) {
      await this.featureRepository.update(feature.id, {
        displayOrder: feature.displayOrder + 1,
      });
    }
  }

  private async shiftDisplayOrdersDown(fromOrder: number): Promise<void> {
    // Fetch all features that need to be shifted, ordered ASC to avoid unique constraint conflicts
    const features = await this.featureRepository
      .createQueryBuilder('feature')
      .where('feature.displayOrder > :fromOrder', { fromOrder })
      .orderBy('feature.displayOrder', 'ASC')
      .getMany();

    // Update each feature individually from lowest to highest to avoid conflicts
    for (const feature of features) {
      await this.featureRepository.update(feature.id, {
        displayOrder: feature.displayOrder - 1,
      });
    }
  }

  private async getFeatureAtDisplayOrder(
    order: number,
    excludeId?: number,
  ): Promise<Feature | null> {
    const queryBuilder = this.featureRepository
      .createQueryBuilder('feature')
      .where('feature.displayOrder = :order', { order });

    if (excludeId) {
      queryBuilder.andWhere('feature.id != :excludeId', { excludeId });
    }

    return queryBuilder.getOne();
  }
}
