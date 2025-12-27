import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Plan } from './plan.entity';
import { BrochureUpload } from './brochure-upload.entity';

@Entity('companies')
export class Company {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  // REAL FIELD (mapped to DB)
  @Column({ name: 'logo_url', length: 500, nullable: true })
  logoUrl?: string;

  // VIRTUAL ALIAS (keeps old code working, but optional)
  logo_url?: string;

  @Column({ name: 'company_url', type: 'varchar', length: 255, nullable: true })
  companyUrl?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => Plan, (plan) => plan.company)
  plans: Plan[];

  @OneToMany(() => BrochureUpload, (upload) => upload.company)
  uploads: BrochureUpload[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
