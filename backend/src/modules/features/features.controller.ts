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

  @Get()
  findAll(
    @Query('categoryId') categoryId?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const catId = categoryId ? parseInt(categoryId, 10) : undefined;
    return this.featuresService.findAll(catId, includeInactive === 'true');
  }

  @Get('validate-weights/:categoryId')
  validateWeights(@Param('categoryId', ParseIntPipe) categoryId: number) {
    return this.featuresService.validateWeightsForCategory(categoryId);
  }

  @Get('weights/:categoryId')
  getWeightsByCategory(@Param('categoryId', ParseIntPipe) categoryId: number) {
    return this.featuresService.getWeightsByCategoryId(categoryId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.featuresService.findOne(id);
  }

  @Post()
  create(@Body() createFeatureDto: CreateFeatureDto) {
    return this.featuresService.create(createFeatureDto);
  }

  @Put('weights/:categoryId')
  updateWeights(
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Body() updateWeightsDto: UpdateFeatureWeightsDto,
  ) {
    return this.featuresService.updateWeights(categoryId, updateWeightsDto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFeatureDto: UpdateFeatureDto,
  ) {
    return this.featuresService.update(id, updateFeatureDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.featuresService.remove(id);
  }
}
