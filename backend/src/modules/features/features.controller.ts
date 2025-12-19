import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { FeaturesService } from './features.service';
import { CreateFeatureDto } from './dto/create-feature.dto';
import { UpdateFeatureDto } from './dto/update-feature.dto';
import { UpdateFeatureWeightsDto } from './dto/update-weights.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('features')
@UseGuards(JwtAuthGuard)
export class FeaturesController {
  constructor(private readonly featuresService: FeaturesService) {}

  /**
   * Get all features (optionally filtered by category)
   */
  @Get()
  findAll(
    @Query('categoryId') categoryId?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const catId = categoryId ? Number(categoryId) : undefined;
    return this.featuresService.findAll(catId, includeInactive === 'true');
  }

  /**
   * 🔥 Preview Current vs Proposed display order sequence
   * Used BEFORE creating a feature
   */
  @Get('preview-order-shift')
  previewOrderShift(
    @Query('categoryId', ParseIntPipe) categoryId: number,
    @Query('displayOrder', ParseIntPipe) displayOrder: number,
    @Query('name') name: string,
  ) {
    return this.featuresService.previewOrderShift(
      categoryId,
      displayOrder,
      name,
    );
  }

  /**
   * Validate feature weights for a category
   */
  @Get('validate-weights/:categoryId')
  validateWeights(@Param('categoryId', ParseIntPipe) categoryId: number) {
    return this.featuresService.validateWeightsForCategory(categoryId);
  }

  /**
   * Get feature weights by category
   */
  @Get('weights/:categoryId')
  getWeightsByCategory(@Param('categoryId', ParseIntPipe) categoryId: number) {
    return this.featuresService.getWeightsByCategoryId(categoryId);
  }

  /**
   * Get single feature
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.featuresService.findOne(id);
  }

  /**
   * Create feature
   * (display order shifting handled in service)
   */
  @Post()
  create(@Body() createFeatureDto: CreateFeatureDto) {
    return this.featuresService.create(createFeatureDto);
  }

  /**
   * Update feature weights
   */
  @Put('weights/:categoryId')
  updateWeights(
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Body() updateWeightsDto: UpdateFeatureWeightsDto,
  ) {
    return this.featuresService.updateWeights(categoryId, updateWeightsDto);
  }

  /**
   * Update feature
   */
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFeatureDto: UpdateFeatureDto,
  ) {
    return this.featuresService.update(id, updateFeatureDto);
  }

  /**
   * Soft delete feature
   */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.featuresService.remove(id);
  }
}
