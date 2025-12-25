"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompaniesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const company_entity_1 = require("../../entities/company.entity");
let CompaniesService = class CompaniesService {
    constructor(companyRepository) {
        this.companyRepository = companyRepository;
    }
    async findAll(includeInactive = false) {
        const qb = this.companyRepository
            .createQueryBuilder('company')
            .loadRelationCountAndMap('company.activePlansCount', 'company.plans', 'plan', (qb) => qb.where('plan.isActive = :active', { active: true }))
            .orderBy('company.name', 'ASC');
        if (!includeInactive) {
            qb.where('company.isActive = :active', { active: true });
        }
        return qb.getMany();
    }
    async findOne(id) {
        const company = await this.companyRepository.findOne({
            where: { id },
            relations: ['plans'],
        });
        if (!company) {
            throw new common_1.NotFoundException(`Company with ID ${id} not found`);
        }
        return company;
    }
    async create(createCompanyDto) {
        const company = this.companyRepository.create({
            ...createCompanyDto,
            companyUrl: createCompanyDto.companyUrl ?? null,
        });
        return this.companyRepository.save(company);
    }
    async update(id, updateCompanyDto) {
        const company = await this.findOne(id);
        const updatedCompany = {
            ...company,
            ...updateCompanyDto,
            companyUrl: updateCompanyDto.companyUrl !== undefined
                ? updateCompanyDto.companyUrl ?? null
                : company.companyUrl,
        };
        return this.companyRepository.save(updatedCompany);
    }
    async remove(id) {
        const company = await this.findOne(id);
        company.isActive = false;
        await this.companyRepository.save(company);
        return { message: `Company ${company.name} has been deactivated` };
    }
    async hardDelete(id) {
        const company = await this.findOne(id);
        await this.companyRepository.remove(company);
        return { message: `Company has been permanently deleted` };
    }
};
exports.CompaniesService = CompaniesService;
exports.CompaniesService = CompaniesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(company_entity_1.Company)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CompaniesService);
//# sourceMappingURL=companies.service.js.map