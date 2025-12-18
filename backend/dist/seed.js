"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const admin_user_entity_1 = require("./entities/admin-user.entity");
const category_entity_1 = require("./entities/category.entity");
const feature_entity_1 = require("./entities/feature.entity");
const company_entity_1 = require("./entities/company.entity");
const plan_entity_1 = require("./entities/plan.entity");
const plan_feature_value_entity_1 = require("./entities/plan-feature-value.entity");
const brochure_upload_entity_1 = require("./entities/brochure-upload.entity");
const standardization_types_1 = require("./modules/extraction/types/standardization.types");
const dataSource = new typeorm_1.DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_DATABASE || 'testmypolicy2',
    entities: [admin_user_entity_1.AdminUser, category_entity_1.Category, feature_entity_1.Feature, company_entity_1.Company, plan_entity_1.Plan, plan_feature_value_entity_1.PlanFeatureValue, brochure_upload_entity_1.BrochureUpload],
    synchronize: true,
});
async function seed() {
    try {
        await dataSource.initialize();
        console.log('Database connected');
        const adminRepo = dataSource.getRepository(admin_user_entity_1.AdminUser);
        const existingAdmin = await adminRepo.findOne({ where: { email: 'admin@testmypolicy.com' } });
        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const admin = adminRepo.create({
                email: 'admin@testmypolicy.com',
                password: hashedPassword,
                name: 'Admin User',
            });
            await adminRepo.save(admin);
            console.log('Default admin created: admin@testmypolicy.com / admin123');
        }
        else {
            console.log('Admin user already exists');
        }
        const categoryRepo = dataSource.getRepository(category_entity_1.Category);
        const existingCategories = await categoryRepo.count();
        if (existingCategories === 0) {
            const categories = [
                { name: 'Must Have', description: 'Essential features that every health insurance plan should have', weightage: 70, displayOrder: 1 },
                { name: 'Good to Have', description: 'Valuable features that enhance the coverage', weightage: 20, displayOrder: 2 },
                { name: 'Add-on', description: 'Optional features that provide extra benefits', weightage: 10, displayOrder: 3 },
            ];
            for (const cat of categories) {
                const category = categoryRepo.create(cat);
                await categoryRepo.save(category);
            }
            console.log('Default categories created (Must Have: 70%, Good to Have: 20%, Add-on: 10%)');
        }
        else {
            console.log('Categories already exist');
        }
        const featureRepo = dataSource.getRepository(feature_entity_1.Feature);
        const existingFeatures = await featureRepo.count();
        if (existingFeatures === 0) {
            const allCategories = await categoryRepo.find();
            const mustHave = allCategories.find(c => c.name === 'Must Have');
            const goodToHave = allCategories.find(c => c.name === 'Good to Have');
            const addon = allCategories.find(c => c.name === 'Add-on');
            const features = [
                {
                    categoryId: mustHave.id,
                    name: 'Hospitalization Expenses',
                    weightage: 25,
                    displayOrder: 1,
                    extractionKeywords: JSON.stringify(['hospitalization', 'inpatient', 'hospital expenses', 'room charges']),
                    valueType: standardization_types_1.ValueType.BOOLEAN,
                    standardizationRules: {
                        allowedValues: ['COVERED', 'NOT_COVERED', 'PARTIAL'],
                        mappings: {
                            'covered': 'COVERED',
                            'yes': 'COVERED',
                            'included': 'COVERED',
                            'available': 'COVERED',
                            'not covered': 'NOT_COVERED',
                            'no': 'NOT_COVERED',
                            'excluded': 'NOT_COVERED',
                            'partial': 'PARTIAL',
                            'with conditions': 'PARTIAL'
                        },
                        defaultValue: 'NOT_SPECIFIED'
                    }
                },
                {
                    categoryId: mustHave.id,
                    name: 'Pre-Hospitalization',
                    weightage: 15,
                    displayOrder: 2,
                    extractionKeywords: JSON.stringify(['pre-hospitalization', 'before hospitalization', 'pre-hospital']),
                    valueType: standardization_types_1.ValueType.NUMERIC,
                    standardizationRules: {
                        normalize: { unit: 'days', minValue: 0, maxValue: 180 },
                        mappings: {
                            '30 days': '30',
                            '60 days': '60',
                            '90 days': '90',
                            'not covered': '0',
                            'not applicable': '0'
                        },
                        defaultValue: '0'
                    }
                },
                {
                    categoryId: mustHave.id,
                    name: 'Post-Hospitalization',
                    weightage: 15,
                    displayOrder: 3,
                    extractionKeywords: JSON.stringify(['post-hospitalization', 'after hospitalization', 'post-hospital', 'discharge']),
                    valueType: standardization_types_1.ValueType.NUMERIC,
                    standardizationRules: {
                        normalize: { unit: 'days', minValue: 0, maxValue: 365 },
                        mappings: {
                            '60 days': '60',
                            '90 days': '90',
                            '180 days': '180',
                            'not covered': '0',
                            'not applicable': '0'
                        },
                        defaultValue: '0'
                    }
                },
                {
                    categoryId: mustHave.id,
                    name: 'Day Care Treatment',
                    weightage: 15,
                    displayOrder: 4,
                    extractionKeywords: JSON.stringify(['day care', 'daycare treatment', '24 hours', 'outpatient surgery']),
                    valueType: standardization_types_1.ValueType.BOOLEAN,
                    standardizationRules: {
                        allowedValues: ['COVERED', 'NOT_COVERED', 'LIMITED'],
                        mappings: {
                            'covered': 'COVERED',
                            'yes': 'COVERED',
                            'available': 'COVERED',
                            'all day care': 'COVERED',
                            'not covered': 'NOT_COVERED',
                            'no': 'NOT_COVERED',
                            'limited': 'LIMITED',
                            'selected procedures': 'LIMITED'
                        },
                        defaultValue: 'NOT_SPECIFIED'
                    }
                },
                {
                    categoryId: mustHave.id,
                    name: 'Sum Insured',
                    weightage: 20,
                    displayOrder: 5,
                    extractionKeywords: JSON.stringify(['sum insured', 'coverage amount', 'cover amount', 'lacs', 'crores']),
                    valueType: standardization_types_1.ValueType.CURRENCY,
                    standardizationRules: {
                        normalize: { unit: 'lakhs', minValue: 1, maxValue: 1000 },
                        mappings: {
                            '1 crore': '100',
                            '50 lakhs': '50',
                            '25 lakhs': '25',
                            '10 lakhs': '10',
                            '5 lakhs': '5'
                        },
                        defaultValue: '0'
                    }
                },
                {
                    categoryId: mustHave.id,
                    name: 'Room Rent',
                    weightage: 10,
                    displayOrder: 6,
                    extractionKeywords: JSON.stringify(['room rent', 'room category', 'room charges', 'single room', 'private room']),
                    valueType: standardization_types_1.ValueType.ENUM,
                    standardizationRules: {
                        allowedValues: ['NO_LIMIT', 'SINGLE_PRIVATE', 'TWIN_SHARING', 'GENERAL_WARD', 'PERCENTAGE_SI', 'FIXED_AMOUNT'],
                        mappings: {
                            'no limit': 'NO_LIMIT',
                            'no capping': 'NO_LIMIT',
                            'no sub-limit': 'NO_LIMIT',
                            'single private': 'SINGLE_PRIVATE',
                            'single ac': 'SINGLE_PRIVATE',
                            'private room': 'SINGLE_PRIVATE',
                            'twin sharing': 'TWIN_SHARING',
                            'shared room': 'TWIN_SHARING',
                            'general ward': 'GENERAL_WARD',
                            '% of sum insured': 'PERCENTAGE_SI',
                            '1% of si': 'PERCENTAGE_SI',
                            '2% of si': 'PERCENTAGE_SI'
                        },
                        defaultValue: 'NOT_SPECIFIED'
                    }
                },
                {
                    categoryId: goodToHave.id,
                    name: 'Restoration Benefit',
                    weightage: 25,
                    displayOrder: 1,
                    extractionKeywords: JSON.stringify(['restoration', 'restore', 'reinstatement', 'unlimited restoration']),
                    valueType: standardization_types_1.ValueType.ENUM,
                    standardizationRules: {
                        allowedValues: ['NONE', '100_PERCENT', 'UNLIMITED', 'PARTIAL', '50_PERCENT'],
                        mappings: {
                            'not available': 'NONE',
                            'no restoration': 'NONE',
                            '100%': '100_PERCENT',
                            '100% restoration': '100_PERCENT',
                            'full restoration': '100_PERCENT',
                            'unlimited': 'UNLIMITED',
                            'unlimited restoration': 'UNLIMITED',
                            '50%': '50_PERCENT',
                            'partial': 'PARTIAL'
                        },
                        defaultValue: 'NONE'
                    }
                },
                {
                    categoryId: goodToHave.id,
                    name: 'AYUSH Coverage',
                    weightage: 20,
                    displayOrder: 2,
                    extractionKeywords: JSON.stringify(['ayush', 'ayurveda', 'homeopathy', 'unani', 'siddha', 'naturopathy']),
                    valueType: standardization_types_1.ValueType.BOOLEAN,
                    standardizationRules: {
                        allowedValues: ['COVERED', 'NOT_COVERED', 'LIMITED'],
                        mappings: {
                            'covered': 'COVERED',
                            'yes': 'COVERED',
                            'available': 'COVERED',
                            'not covered': 'NOT_COVERED',
                            'no': 'NOT_COVERED',
                            'limited': 'LIMITED',
                            'up to': 'LIMITED',
                            'subject to': 'LIMITED'
                        },
                        defaultValue: 'NOT_SPECIFIED'
                    }
                },
                {
                    categoryId: goodToHave.id,
                    name: 'Ambulance Cover',
                    weightage: 15,
                    displayOrder: 3,
                    extractionKeywords: JSON.stringify(['ambulance', 'road ambulance', 'emergency transport']),
                    valueType: standardization_types_1.ValueType.CURRENCY,
                    standardizationRules: {
                        normalize: { unit: 'rupees', minValue: 0, maxValue: 100000 },
                        mappings: {
                            'unlimited': '-1',
                            'no limit': '-1',
                            'not covered': '0',
                            'no': '0',
                            '2000': '2000',
                            '5000': '5000',
                            '10000': '10000'
                        },
                        defaultValue: '0'
                    }
                },
                {
                    categoryId: goodToHave.id,
                    name: 'Health Check-up',
                    weightage: 15,
                    displayOrder: 4,
                    extractionKeywords: JSON.stringify(['health check', 'health checkup', 'preventive', 'annual checkup']),
                    valueType: standardization_types_1.ValueType.ENUM,
                    standardizationRules: {
                        allowedValues: ['NONE', 'ANNUAL', 'BIENNIAL', 'CONDITIONAL', 'ONCE_IN_POLICY'],
                        mappings: {
                            'not available': 'NONE',
                            'no': 'NONE',
                            'not covered': 'NONE',
                            'annual': 'ANNUAL',
                            'every year': 'ANNUAL',
                            'yearly': 'ANNUAL',
                            'biennial': 'BIENNIAL',
                            'once in 2 years': 'BIENNIAL',
                            'every 2 years': 'BIENNIAL',
                            'after claim free years': 'CONDITIONAL',
                            'on renewal': 'CONDITIONAL',
                            'once in policy': 'ONCE_IN_POLICY'
                        },
                        defaultValue: 'NONE'
                    }
                },
                {
                    categoryId: goodToHave.id,
                    name: 'No Claim Bonus',
                    weightage: 15,
                    displayOrder: 5,
                    extractionKeywords: JSON.stringify(['no claim bonus', 'NCB', 'cumulative bonus', 'bonus']),
                    valueType: standardization_types_1.ValueType.PERCENTAGE,
                    standardizationRules: {
                        normalize: { unit: 'percent', minValue: 0, maxValue: 100 },
                        mappings: {
                            'not available': '0',
                            'no': '0',
                            '5%': '5',
                            '10%': '10',
                            '20%': '20',
                            '25%': '25',
                            '50%': '50',
                            '100%': '100',
                            'upto 50%': '50',
                            'upto 100%': '100'
                        },
                        defaultValue: '0'
                    }
                },
                {
                    categoryId: goodToHave.id,
                    name: 'Domiciliary Treatment',
                    weightage: 10,
                    displayOrder: 6,
                    extractionKeywords: JSON.stringify(['domiciliary', 'home treatment', 'treatment at home']),
                    valueType: standardization_types_1.ValueType.BOOLEAN,
                    standardizationRules: {
                        allowedValues: ['COVERED', 'NOT_COVERED'],
                        mappings: {
                            'covered': 'COVERED',
                            'yes': 'COVERED',
                            'available': 'COVERED',
                            'not covered': 'NOT_COVERED',
                            'no': 'NOT_COVERED',
                            'not available': 'NOT_COVERED'
                        },
                        defaultValue: 'NOT_SPECIFIED'
                    }
                },
                {
                    categoryId: addon.id,
                    name: 'Maternity Cover',
                    weightage: 30,
                    displayOrder: 1,
                    extractionKeywords: JSON.stringify(['maternity', 'pregnancy', 'delivery', 'newborn']),
                    valueType: standardization_types_1.ValueType.CURRENCY,
                    standardizationRules: {
                        normalize: { unit: 'rupees', minValue: 0, maxValue: 500000 },
                        mappings: {
                            'not covered': '0',
                            'no': '0',
                            'not available': '0',
                            'optional add-on': '0',
                            '25000': '25000',
                            '50000': '50000',
                            '75000': '75000',
                            '100000': '100000'
                        },
                        defaultValue: '0'
                    }
                },
                {
                    categoryId: addon.id,
                    name: 'Critical Illness',
                    weightage: 25,
                    displayOrder: 2,
                    extractionKeywords: JSON.stringify(['critical illness', 'critical care', 'major illness']),
                    valueType: standardization_types_1.ValueType.BOOLEAN,
                    standardizationRules: {
                        allowedValues: ['COVERED', 'NOT_COVERED', 'ADDON_ONLY'],
                        mappings: {
                            'covered': 'COVERED',
                            'yes': 'COVERED',
                            'included': 'COVERED',
                            'not covered': 'NOT_COVERED',
                            'no': 'NOT_COVERED',
                            'add-on': 'ADDON_ONLY',
                            'optional': 'ADDON_ONLY',
                            'rider': 'ADDON_ONLY'
                        },
                        defaultValue: 'NOT_SPECIFIED'
                    }
                },
                {
                    categoryId: addon.id,
                    name: 'Air Ambulance',
                    weightage: 15,
                    displayOrder: 3,
                    extractionKeywords: JSON.stringify(['air ambulance', 'helicopter', 'air transport']),
                    valueType: standardization_types_1.ValueType.CURRENCY,
                    standardizationRules: {
                        normalize: { unit: 'rupees', minValue: 0, maxValue: 1000000 },
                        mappings: {
                            'not covered': '0',
                            'no': '0',
                            'not available': '0',
                            'unlimited': '-1',
                            '100000': '100000',
                            '250000': '250000',
                            '500000': '500000',
                            '1 lakh': '100000',
                            '2.5 lakhs': '250000',
                            '5 lakhs': '500000'
                        },
                        defaultValue: '0'
                    }
                },
                {
                    categoryId: addon.id,
                    name: 'OPD Cover',
                    weightage: 15,
                    displayOrder: 4,
                    extractionKeywords: JSON.stringify(['OPD', 'outpatient', 'consultation', 'doctor visit']),
                    valueType: standardization_types_1.ValueType.CURRENCY,
                    standardizationRules: {
                        normalize: { unit: 'rupees', minValue: 0, maxValue: 100000 },
                        mappings: {
                            'not covered': '0',
                            'no': '0',
                            'not available': '0',
                            'included': '-1',
                            '5000': '5000',
                            '10000': '10000',
                            '15000': '15000',
                            '25000': '25000'
                        },
                        defaultValue: '0'
                    }
                },
                {
                    categoryId: addon.id,
                    name: 'International Coverage',
                    weightage: 15,
                    displayOrder: 5,
                    extractionKeywords: JSON.stringify(['international', 'worldwide', 'global coverage', 'overseas']),
                    valueType: standardization_types_1.ValueType.BOOLEAN,
                    standardizationRules: {
                        allowedValues: ['COVERED', 'NOT_COVERED', 'LIMITED'],
                        mappings: {
                            'covered': 'COVERED',
                            'yes': 'COVERED',
                            'worldwide': 'COVERED',
                            'global': 'COVERED',
                            'not covered': 'NOT_COVERED',
                            'no': 'NOT_COVERED',
                            'india only': 'NOT_COVERED',
                            'limited': 'LIMITED',
                            'emergency only': 'LIMITED',
                            'selected countries': 'LIMITED'
                        },
                        defaultValue: 'NOT_SPECIFIED'
                    }
                },
            ];
            for (const feat of features) {
                const feature = featureRepo.create(feat);
                await featureRepo.save(feature);
            }
            console.log('Default features created');
        }
        else {
            console.log('Features already exist');
        }
        const companyRepo = dataSource.getRepository(company_entity_1.Company);
        const existingCompanies = await companyRepo.count();
        if (existingCompanies === 0) {
            const company = companyRepo.create({
                name: 'ManipalCigna Health Insurance',
                description: 'A comprehensive health insurance provider',
            });
            await companyRepo.save(company);
            console.log('Sample company created');
        }
        else {
            console.log('Companies already exist');
        }
        console.log('\nSeed completed successfully!');
        console.log('\nYou can now login with:');
        console.log('Email: admin@testmypolicy.com');
        console.log('Password: admin123');
        await dataSource.destroy();
    }
    catch (error) {
        console.error('Seed failed:', error);
        process.exit(1);
    }
}
seed();
//# sourceMappingURL=seed.js.map