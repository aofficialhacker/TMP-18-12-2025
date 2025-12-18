import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
export declare class CompaniesController {
    private readonly companiesService;
    constructor(companiesService: CompaniesService);
    findAll(includeInactive?: string): Promise<import("../../entities").Company[]>;
    findOne(id: number): Promise<import("../../entities").Company>;
    create(createCompanyDto: CreateCompanyDto): Promise<import("../../entities").Company>;
    update(id: number, updateCompanyDto: UpdateCompanyDto): Promise<import("../../entities").Company>;
    remove(id: number): Promise<{
        message: string;
    }>;
}
