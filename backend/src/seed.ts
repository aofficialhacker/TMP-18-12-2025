import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AdminUser } from './entities/admin-user.entity';
import { Category } from './entities/category.entity';
import { Feature } from './entities/feature.entity';
import { Company } from './entities/company.entity';
import { Plan } from './entities/plan.entity';
import { PlanFeatureValue } from './entities/plan-feature-value.entity';
import { BrochureUpload } from './entities/brochure-upload.entity';
import { ValueType } from './modules/extraction/types/standardization.types';

const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'Helloworld@11',
  database: process.env.DB_DATABASE || 'testmypolicy2',
  entities: [AdminUser, Category, Feature, Company, Plan, PlanFeatureValue, BrochureUpload],
  synchronize: true,
});

async function seed() {
  try {
    await dataSource.initialize();
    console.log('Database connected');

    // Create default admin user
    const adminRepo = dataSource.getRepository(AdminUser);
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
    } else {
      console.log('Admin user already exists');
    }

    // Create default categories
    const categoryRepo = dataSource.getRepository(Category);
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
    } else {
      console.log('Categories already exist');
    }

    // Create default features
    const featureRepo = dataSource.getRepository(Feature);
    const existingFeatures = await featureRepo.count();

    if (existingFeatures === 0) {
      const allCategories = await categoryRepo.find();
      const mustHave = allCategories.find(c => c.name === 'Must Have');
      const goodToHave = allCategories.find(c => c.name === 'Good to Have');
      const addon = allCategories.find(c => c.name === 'Add-on');

      const features = [
        // Must Have features (sum = 100)
        {
          categoryId: mustHave.id,
          name: 'Hospitalization Expenses',
          weightage: 25,
          displayOrder: 1,
          extractionKeywords: JSON.stringify(['hospitalization', 'inpatient', 'hospital expenses', 'room charges']),
          valueType: ValueType.BOOLEAN,
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
          valueType: ValueType.NUMERIC,
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
          valueType: ValueType.NUMERIC,
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
          valueType: ValueType.BOOLEAN,
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
          valueType: ValueType.CURRENCY,
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
          valueType: ValueType.ENUM,
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

        // Good to Have features (sum = 100)
        {
          categoryId: goodToHave.id,
          name: 'Restoration Benefit',
          weightage: 25,
          displayOrder: 1,
          extractionKeywords: JSON.stringify(['restoration', 'restore', 'reinstatement', 'unlimited restoration']),
          valueType: ValueType.ENUM,
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
          valueType: ValueType.BOOLEAN,
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
          valueType: ValueType.CURRENCY,
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
          valueType: ValueType.ENUM,
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
          valueType: ValueType.PERCENTAGE,
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
          valueType: ValueType.BOOLEAN,
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

        // Add-on features (sum = 100)
        {
          categoryId: addon.id,
          name: 'Maternity Cover',
          weightage: 30,
          displayOrder: 1,
          extractionKeywords: JSON.stringify(['maternity', 'pregnancy', 'delivery', 'newborn']),
          valueType: ValueType.CURRENCY,
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
          valueType: ValueType.BOOLEAN,
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
          valueType: ValueType.CURRENCY,
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
          valueType: ValueType.CURRENCY,
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
          valueType: ValueType.BOOLEAN,
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
    } else {
      console.log('Features already exist');
    }

    // Create sample company
    const companyRepo = dataSource.getRepository(Company);
    const existingCompanies = await companyRepo.count();

    if (existingCompanies === 0) {
      const company = companyRepo.create({
        name: 'ManipalCigna Health Insurance',
        description: 'A comprehensive health insurance provider',
      });
      await companyRepo.save(company);
      console.log('Sample company created');
    } else {
      console.log('Companies already exist');
    }

    console.log('\nSeed completed successfully!');
    console.log('\nYou can now login with:');
    console.log('Email: admin@testmypolicy.com');
    console.log('Password: admin123');

    await dataSource.destroy();
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
