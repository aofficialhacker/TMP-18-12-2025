import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Company } from './company.entity';
import { PlanFeatureValue } from './plan-feature-value.entity';
import { BrochureUpload } from './brochure-upload.entity';

export enum PlanStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  PUBLISHED = 'published',
}

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'company_id' })
  companyId: number;

  @ManyToOne(() => Company, (company) => company.plans, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ length: 255 })
  name: string;

  @Column({ name: 'sum_insured_min', type: 'decimal', precision: 15, scale: 2, nullable: true })
  sumInsuredMin: number;

  @Column({ name: 'sum_insured_max', type: 'decimal', precision: 15, scale: 2, nullable: true })
  sumInsuredMax: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'brochure_url', length: 500, nullable: true })
  brochureUrl: string;

  @Column({
    type: 'enum',
    enum: PlanStatus,
    default: PlanStatus.DRAFT,
  })
  status: PlanStatus;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => PlanFeatureValue, (pfv) => pfv.plan)
  featureValues: PlanFeatureValue[];

  @OneToMany(() => BrochureUpload, (upload) => upload.plan)
  uploads: BrochureUpload[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
