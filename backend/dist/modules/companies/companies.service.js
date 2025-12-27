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
const fs_1 = require("fs");
const path_1 = require("path");
let CompaniesService = class CompaniesService {
    constructor(companyRepository) {
        this.companyRepository = companyRepository;
    }
    async findAll(includeInactive = false) {
        const qb = this.companyRepository
            .createQueryBuilder('company')
            .loadRelationCountAndMap('company.activePlansCount', 'company.plans', 'plan', qb => qb.where('plan.isActive = :active', { active: true }))
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
        if (!company)
            throw new common_1.NotFoundException(`Company with ID ${id} not found`);
        return company;
    }
    async create(dto) {
        const logo = dto.logo_url ??
            dto.logoUrl ??
            null;
        const entity = this.companyRepository.create({
            ...dto,
            logoUrl: logo,
            companyUrl: dto.companyUrl ?? null,
        });
        return await this.companyRepository.save(entity);
    }
    async update(id, dto) {
        const company = await this.findOne(id);
        const logo = dto.logo_url ??
            dto.logoUrl ??
            undefined;
        const updated = {
            ...company,
            ...dto,
            companyUrl: dto.companyUrl !== undefined ? dto.companyUrl ?? null : company.companyUrl,
            ...(logo !== undefined ? { logoUrl: logo } : {}),
        };
        return await this.companyRepository.save(updated);
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
    async downloadAndSaveLogo(url) {
        const response = await fetch(url);
        const buffer = Buffer.from(await response.arrayBuffer());
        const filename = Date.now() + (0, path_1.extname)(url);
        (0, fs_1.writeFileSync)(`public/logos/${filename}`, buffer);
        return filename;
    }
};
exports.CompaniesService = CompaniesService;
exports.CompaniesService = CompaniesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(company_entity_1.Company)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CompaniesService);
//# sourceMappingURL=companies.service.js.map