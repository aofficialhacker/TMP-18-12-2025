import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../../entities/company.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  /**
   * Returns companies with ACTIVE plans count
   * Preserves includeInactive behavior
   */
  async findAll(includeInactive = false): Promise<Company[]> {
    const qb = this.companyRepository
      .createQueryBuilder('company')
      .loadRelationCountAndMap(
        'company.activePlansCount',
        'company.plans',
        'plan',
        (qb) => qb.where('plan.isActive = :active', { active: true }),
      )
      .orderBy('company.name', 'ASC');

    if (!includeInactive) {
      qb.where('company.isActive = :active', { active: true });
    }

    return qb.getMany();
  }

  async findOne(id: number): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { id },
      relations: ['plans'],
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    return company;
  }

  async create(createCompanyDto: CreateCompanyDto): Promise<Company> {
    const company = this.companyRepository.create({
      ...createCompanyDto,
      companyUrl: createCompanyDto.companyUrl ?? null,
    });

    return this.companyRepository.save(company);
  }

  async update(id: number, updateCompanyDto: UpdateCompanyDto): Promise<Company> {
    const company = await this.findOne(id);

    const updatedCompany: Company = {
      ...company,
      ...updateCompanyDto,
      companyUrl:
        updateCompanyDto.companyUrl !== undefined
          ? updateCompanyDto.companyUrl ?? null
          : company.companyUrl,
    };

    return this.companyRepository.save(updatedCompany);
  }

  async remove(id: number): Promise<{ message: string }> {
    const company = await this.findOne(id);
    company.isActive = false;
    await this.companyRepository.save(company);

    return { message: `Company ${company.name} has been deactivated` };
  }

  async hardDelete(id: number): Promise<{ message: string }> {
    const company = await this.findOne(id);
    await this.companyRepository.remove(company);

    return { message: `Company has been permanently deleted` };
  }
}
