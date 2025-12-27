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

  /* ================= READ ================= */

  async findAll(categoryId?: number, includeInactive = false): Promise<Feature[]> {
    const where: any = includeInactive ? {} : { isActive: true };
    if (categoryId) where.categoryId = categoryId;

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

  /* ================= CREATE ================= */

  async create(dto: CreateFeatureDto): Promise<Feature> {
    const category = await this.categoryRepository.findOne({
      where: { id: dto.categoryId, isActive: true },
    });

    if (!category) {
      throw new NotFoundException(
        `Category with ID ${dto.categoryId} not found or inactive`,
      );
    }

<<<<<<< HEAD
    // ✅ displayOrder rules
    let displayOrder =
      dto.displayOrder && dto.displayOrder >= 1 ? dto.displayOrder : undefined;

    if (!displayOrder) {
      const max = await this.getMaxDisplayOrder();
      displayOrder = max + 1;
    } else {
      const existing = await this.getFeatureAtDisplayOrder(displayOrder);
      if (existing) {
=======
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
>>>>>>> 3a53d9e670701c580974d464e08a8b4396906d23
        await this.shiftDisplayOrdersUp(displayOrder);
      }
    }

    const feature = this.featureRepository.create({
<<<<<<< HEAD
      ...dto,
      displayOrder,
      extractionKeywords: dto.extractionKeywords
        ? JSON.stringify(dto.extractionKeywords)
=======
      ...createFeatureDto,
      displayOrder,
      extractionKeywords: createFeatureDto.extractionKeywords
        ? JSON.stringify(createFeatureDto.extractionKeywords)
>>>>>>> 3a53d9e670701c580974d464e08a8b4396906d23
        : null,
    });

    return this.featureRepository.save(feature);
  }

  /* ================= UPDATE ================= */

  async update(id: number, dto: UpdateFeatureDto): Promise<Feature> {
    const feature = await this.findOne(id);

    if (dto.displayOrder !== undefined && dto.displayOrder < 1) {
      throw new BadRequestException('Display order must start from 1');
    }

<<<<<<< HEAD
    if (
      dto.displayOrder !== undefined &&
      dto.displayOrder !== feature.displayOrder
    ) {
      const oldOrder = feature.displayOrder;
      const newOrder = dto.displayOrder;

      // Fetch all features and reorder them in memory to avoid unique constraint conflicts
      const allFeatures = await this.featureRepository.find({
        order: { displayOrder: 'ASC' },
      });

      // Remove the current feature from the list
      const otherFeatures = allFeatures.filter(f => f.id !== id);

      // Sort by current display order
      otherFeatures.sort((a, b) => a.displayOrder - b.displayOrder);

      // Insert the feature at the new position
      const reorderedFeatures = [
        ...otherFeatures.slice(0, newOrder - 1),
        feature,
        ...otherFeatures.slice(newOrder - 1),
      ];

      // PHASE 1: Move all features to temporary positions (negative numbers) to avoid unique constraint
      for (let i = 0; i < reorderedFeatures.length; i++) {
        reorderedFeatures[i].displayOrder = -(i + 1);
      }
      await this.featureRepository.save(reorderedFeatures);

      // PHASE 2: Update all features to their final positions
      for (let i = 0; i < reorderedFeatures.length; i++) {
        reorderedFeatures[i].displayOrder = i + 1;
      }
      await this.featureRepository.save(reorderedFeatures);

      // Update feature object to reflect new position
      feature.displayOrder = newOrder;
    }

    // Continue with normal update flow for other fields
    const updateData: any = { ...dto };

    if (dto.extractionKeywords) {
      updateData.extractionKeywords = JSON.stringify(dto.extractionKeywords);
=======
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
>>>>>>> 3a53d9e670701c580974d464e08a8b4396906d23
    }

    Object.assign(feature, updateData);
    return this.featureRepository.save(feature);
  }

  /* ================= DELETE ================= */

  async remove(id: number): Promise<{ message: string }> {
    const feature = await this.findOne(id);
    feature.isActive = false;
    await this.featureRepository.save(feature);

    return { message: `Feature "${feature.name}" has been deactivated` };
  }

  /* ================= WEIGHTS ================= */

  async updateWeights(
    categoryId: number,
    dto: UpdateFeatureWeightsDto,
  ): Promise<Feature[]> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId, isActive: true },
    });

    if (!category) {
      throw new BadRequestException('Category not found or inactive');
    }

    const total = dto.features.reduce((s, f) => s + f.weightage, 0);

    if (total !== 100) {
      throw new BadRequestException(
        `Feature weights must sum to 100. Current total: ${total}`,
      );
    }

    for (const f of dto.features) {
      await this.featureRepository.update(f.id, {
        weightage: f.weightage,
      });
    }

    return this.findAll(categoryId);
  }

  /* ======================================================
     ✅ METHODS REQUIRED BY features.controller.ts
     ====================================================== */

  async validateWeightsForCategory(categoryId: number): Promise<{
    categoryId: number;
    totalWeight: number;
    isValid: boolean;
  }> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId, isActive: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found or inactive');
    }

    const features = await this.featureRepository.find({
      where: { categoryId, isActive: true },
    });

    const totalWeight = features.reduce(
      (sum, f) => sum + f.weightage,
      0,
    );

    return {
      categoryId,
      totalWeight,
      isValid: totalWeight === 100,
    };
  }

  async getWeightsByCategoryId(categoryId: number): Promise<{
    categoryId: number;
    features: { id: number; name: string; weightage: number }[];
  }> {
    const features = await this.featureRepository.find({
      where: { categoryId, isActive: true },
      order: { displayOrder: 'ASC' },
    });

    return {
      categoryId,
      features: features.map(f => ({
        id: f.id,
        name: f.name,
        weightage: f.weightage,
      })),
    };
  }

  /* ================= HELPERS ================= */

  private async getMaxDisplayOrder(): Promise<number> {
    const r = await this.featureRepository
      .createQueryBuilder('f')
      .select('MAX(f.displayOrder)', 'max')
      .getRawOne();

    return r?.max || 0;
  }

  private async shiftDisplayOrdersUp(
    fromOrder: number,
    excludeId?: number,
  ): Promise<void> {
    const qb = this.featureRepository
      .createQueryBuilder('f')
      .where('f.displayOrder >= :fromOrder', { fromOrder })
      .orderBy('f.displayOrder', 'DESC');

    if (excludeId) {
      qb.andWhere('f.id != :excludeId', { excludeId });
    }

    const rows = await qb.getMany();

    for (const r of rows) {
      await this.featureRepository.update(r.id, {
        displayOrder: r.displayOrder + 1,
      });
    }
  }

  private async shiftDisplayOrdersDown(fromOrder: number): Promise<void> {
    const rows = await this.featureRepository
      .createQueryBuilder('f')
      .where('f.displayOrder > :fromOrder', { fromOrder })
      .orderBy('f.displayOrder', 'ASC')
      .getMany();

    for (const r of rows) {
      await this.featureRepository.update(r.id, {
        displayOrder: r.displayOrder - 1,
      });
    }
  }

  private async getFeatureAtDisplayOrder(
    order: number,
    excludeId?: number,
  ): Promise<Feature | null> {
    const qb = this.featureRepository
      .createQueryBuilder('f')
      .where('f.displayOrder = :order', { order });

    if (excludeId) {
      qb.andWhere('f.id != :excludeId', { excludeId });
    }

    return qb.getOne();
  }

  private async shiftDisplayOrdersBetween(
    fromOrder: number,
    toOrder: number,
    excludeId?: number,
  ): Promise<void> {
    const qb = this.featureRepository
      .createQueryBuilder('f')
      .where('f.displayOrder >= :fromOrder', { fromOrder })
      .andWhere('f.displayOrder <= :toOrder', { toOrder })
      .orderBy('f.displayOrder', 'ASC');

    if (excludeId) {
      qb.andWhere('f.id != :excludeId', { excludeId });
    }

    const rows = await qb.getMany();

    for (const r of rows) {
      await this.featureRepository.update(r.id, {
        displayOrder: r.displayOrder - 1,
      });
    }
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
