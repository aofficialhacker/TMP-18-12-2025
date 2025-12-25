import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Plan } from './plan.entity';
import { Company } from './company.entity';
import { AdminUser } from './admin-user.entity';

export enum ExtractionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('brochure_uploads')
export class BrochureUpload {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'plan_id', nullable: true })
  planId: number;

  @ManyToOne(() => Plan, (plan) => plan.uploads, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  @Column({ name: 'company_id', nullable: true })
  companyId: number;

  @ManyToOne(() => Company, (company) => company.uploads, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'original_filename', length: 255 })
  originalFilename: string;

  @Column({ name: 'stored_filename', length: 255 })
  storedFilename: string;

  @Column({ name: 'file_path', length: 500 })
  filePath: string;

  @Column({
    name: 'extraction_status',
    type: 'enum',
    enum: ExtractionStatus,
    default: ExtractionStatus.PENDING,
  })
  extractionStatus: ExtractionStatus;

  /* ✅ NEW: REAL EXTRACTION PROGRESS (0–100) */
  @Column({ name: 'extraction_progress', type: 'int', default: 0 })
  extractionProgress: number;

  @Column({ name: 'extraction_result', type: 'json', nullable: true })
  extractionResult: any;

  @Column({ name: 'uploaded_by' })
  uploadedById: number;

  @ManyToOne(() => AdminUser, (user) => user.uploads, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'uploaded_by' })
  uploadedBy: AdminUser;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
