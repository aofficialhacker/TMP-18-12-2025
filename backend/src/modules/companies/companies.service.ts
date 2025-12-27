import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../../entities/company.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { writeFileSync } from 'fs';
import { extname } from 'path';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async findAll(includeInactive = false): Promise<Company[]> {
    const qb = this.companyRepository
      .createQueryBuilder('company')
      .loadRelationCountAndMap(
        'company.activePlansCount',
        'company.plans',
        'plan',
        qb => qb.where('plan.isActive = :active', { active: true }),
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
    if (!company) throw new NotFoundException(`Company with ID ${id} not found`);
    return company;
  }

  async create(dto: CreateCompanyDto): Promise<Company> {
    const logo =
      (dto as any).logo_url ??
      (dto as any).logoUrl ??
      null;

    const entity = this.companyRepository.create({
      ...dto,
      logoUrl: logo,
      companyUrl: dto.companyUrl ?? null,
    } as Partial<Company>);

    return await this.companyRepository.save(entity) as Company;
  }

  async update(id: number, dto: UpdateCompanyDto): Promise<Company> {
    const company = await this.findOne(id);

    const logo =
      (dto as any).logo_url ??
      (dto as any).logoUrl ??
      undefined;

    const updated: Partial<Company> = {
      ...company,
      ...dto,
      companyUrl:
        dto.companyUrl !== undefined ? dto.companyUrl ?? null : company.companyUrl,
      ...(logo !== undefined ? { logoUrl: logo } : {}),
    };

    return await this.companyRepository.save(updated as Company) as Company;
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

  async downloadAndSaveLogo(url: string): Promise<string> {
    const response = await fetch(url);
    const buffer = Buffer.from(await response.arrayBuffer());
    const filename = Date.now() + extname(url);
    writeFileSync(`public/logos/${filename}`, buffer);
    return filename;
  }
}
