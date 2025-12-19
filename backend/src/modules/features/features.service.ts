import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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

  /* ======================================================
     FETCH
     ====================================================== */

  async findAll(
    categoryId?: number,
    includeInactive = false,
  ): Promise<Feature[]> {
    const where: any = includeInactive ? {} : { isActive: true };
    if (categoryId !== undefined) {
      where.categoryId = categoryId;
    }

    return this.featureRepository.find({
      where,
      relations: ['category'],
      order: { displayOrder: 'ASC' }, // GLOBAL ORDER
    });
  }

  async findOne(id: number): Promise<Feature> {
    const feature = await this.featureRepository.findOne({ where: { id } });
    if (!feature) {
      throw new NotFoundException(`Feature ${id} not found`);
    }
    return feature;
  }

  /* ======================================================
     PREVIEW CURRENT vs PROPOSED DISPLAY ORDER (GLOBAL)
     ====================================================== */

  async previewOrderShift(
    _categoryId: number, // kept for API compatibility
    displayOrder: number,
    newFeatureName: string,
  ) {
    const features = await this.featureRepository.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC' },
    });

    const current = features.map((f, index) => ({
      displayOrder: index + 1,
      name: f.name,
    }));

    const insertAt = Math.min(displayOrder, current.length + 1);
    const conflict = insertAt <= current.length;

    const proposed: { displayOrder: number; name: string }[] = [];
    let order = 1;

    for (let i = 0; i < current.length; i++) {
      if (order === insertAt) {
        proposed.push({
          displayOrder: order++,
          name: newFeatureName,
        });
      }

      proposed.push({
        displayOrder: order++,
        name: current[i].name,
      });
    }

    if (insertAt > current.length) {
      proposed.push({
        displayOrder: order,
        name: newFeatureName,
      });
    }

    return {
      conflict,
      current,
      proposed,
    };
  }

  /* ======================================================
     CREATE FEATURE (GLOBAL DISPLAY ORDER)
     ====================================================== */

  async create(createFeatureDto: CreateFeatureDto): Promise<Feature> {
    return this.featureRepository.manager.transaction(async manager => {
      const category = await manager.findOne(Category, {
        where: { id: createFeatureDto.categoryId, isActive: true },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      // NORMALIZE DISPLAY ORDER
      if (
        createFeatureDto.displayOrder == null ||
        createFeatureDto.displayOrder < 1
      ) {
        const max = await manager
          .createQueryBuilder(Feature, 'f')
          .select('MAX(f.displayOrder)', 'max')
          .getRawOne();

        createFeatureDto.displayOrder = (max?.max || 0) + 1;
      }

      // 🔥 GLOBAL SHIFT (NO CATEGORY FILTER)
      await manager
        .createQueryBuilder()
        .update(Feature)
        .set({ displayOrder: () => 'display_order + 1' })
        .where('display_order >= :displayOrder', {
          displayOrder: createFeatureDto.displayOrder,
        })
        .execute();

      const feature = manager.create(Feature, {
        ...createFeatureDto,
        extractionKeywords: createFeatureDto.extractionKeywords
          ? JSON.stringify(createFeatureDto.extractionKeywords)
          : null,
      });

      return manager.save(feature);
    });
  }

  /* ======================================================
     UPDATE FEATURE (GLOBAL DISPLAY ORDER)
     ====================================================== */

  async update(id: number, updateFeatureDto: UpdateFeatureDto) {
    return this.featureRepository.manager.transaction(async manager => {
      const feature = await manager.findOne(Feature, { where: { id } });
      if (!feature) {
        throw new NotFoundException('Feature not found');
      }

      const oldOrder = feature.displayOrder;
      const newOrder =
        updateFeatureDto.displayOrder != null
          ? updateFeatureDto.displayOrder
          : oldOrder;

      if (newOrder !== oldOrder) {
        if (newOrder < oldOrder) {
          // MOVE UP
          await manager
            .createQueryBuilder()
            .update(Feature)
            .set({ displayOrder: () => 'display_order + 1' })
            .where('display_order >= :newOrder', { newOrder })
            .andWhere('display_order < :oldOrder', { oldOrder })
            .execute();
        } else {
          // MOVE DOWN
          await manager
            .createQueryBuilder()
            .update(Feature)
            .set({ displayOrder: () => 'display_order - 1' })
            .where('display_order > :oldOrder', { oldOrder })
            .andWhere('display_order <= :newOrder', { newOrder })
            .execute();
        }

        feature.displayOrder = newOrder;
      }

      Object.assign(feature, {
        ...updateFeatureDto,
        extractionKeywords: updateFeatureDto.extractionKeywords
          ? JSON.stringify(updateFeatureDto.extractionKeywords)
          : feature.extractionKeywords,
      });

      return manager.save(feature);
    });
  }

  /* ======================================================
     DELETE (SOFT)
     ====================================================== */

  async remove(id: number) {
    const feature = await this.findOne(id);
    feature.isActive = false;
    await this.featureRepository.save(feature);
    return { message: 'Feature deactivated' };
  }

  /* ======================================================
     WEIGHTS
     ====================================================== */

  async updateWeights(categoryId: number, dto: UpdateFeatureWeightsDto) {
    const total = dto.features.reduce((sum, f) => sum + f.weightage, 0);

    if (total !== 100) {
      throw new BadRequestException('Weights must sum to 100');
    }

    for (const f of dto.features) {
      await this.featureRepository.update(f.id, {
        weightage: f.weightage,
      });
    }

    return this.findAll(categoryId);
  }

  async getWeightsByCategoryId(categoryId: number) {
    const features = await this.featureRepository.find({
      where: { categoryId, isActive: true },
      order: { displayOrder: 'ASC' },
    });

    const total = features.reduce((sum, f) => sum + f.weightage, 0);

    return {
      total,
      valid: total === 100,
      features,
    };
  }

  async validateWeightsForCategory(categoryId: number) {
    const res = await this.getWeightsByCategoryId(categoryId);
    return {
      valid: res.valid,
      total: res.total,
      message: res.valid ? 'Valid' : 'Invalid',
    };
  }
}
