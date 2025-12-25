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
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { UpdateFeatureValuesDto } from './dto/update-feature-values.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PlanStatus } from '../../entities/plan.entity';

@Controller('plans')
@UseGuards(JwtAuthGuard)
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  findAll(
    @Query('companyId') companyId?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const cId = companyId ? parseInt(companyId, 10) : undefined;
    return this.plansService.findAll(cId, includeInactive === 'true');
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.plansService.findOne(id);
  }

  @Get(':id/feature-values')
  getFeatureValues(@Param('id', ParseIntPipe) id: number) {
    return this.plansService.getFeatureValues(id);
  }

  /**
   * ✅ NEW – Quote Comparison API
   * Does NOT affect any existing logic
   */
  @Post('compare')
  comparePlans(@Body() body: any) {
    return this.plansService.comparePlans(body);
  }

  @Post()
  create(@Body() createPlanDto: CreatePlanDto) {
    return this.plansService.create(createPlanDto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePlanDto: UpdatePlanDto,
  ) {
    return this.plansService.update(id, updatePlanDto);
  }

  @Put(':id/feature-values')
  updateFeatureValues(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateFeatureValuesDto,
  ) {
    return this.plansService.updateFeatureValues(id, updateDto);
  }

  @Put(':id/publish')
  publish(@Param('id', ParseIntPipe) id: number) {
    return this.plansService.publish(id);
  }

  @Put(':id/status')
  setStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: PlanStatus,
  ) {
    return this.plansService.setStatus(id, status);
  }

  @Put(':id/active')
  setActive(
    @Param('id', ParseIntPipe) id: number,
    @Body('isActive') isActive: boolean,
  ) {
    return this.plansService.setActive(id, isActive);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.plansService.remove(id);
  }
}
