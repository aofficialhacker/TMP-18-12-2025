import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Plan } from './plan.entity';
import { Feature } from './feature.entity';

@Entity('plan_feature_values')
@Unique(['planId', 'featureId'])
export class PlanFeatureValue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'plan_id' })
  planId: number;

  @ManyToOne(() => Plan, (plan) => plan.featureValues, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  @Column({ name: 'feature_id' })
  featureId: number;

  @ManyToOne(() => Feature, (feature) => feature.planFeatureValues, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'feature_id' })
  feature: Feature;

  @Column({ name: 'extracted_value', type: 'text', nullable: true })
  extractedValue: string;

  @Column({ name: 'verified_value', type: 'text', nullable: true })
  verifiedValue: string;

  @Column({ name: 'standardized_value', type: 'varchar', length: 255, nullable: true })
  standardizedValue: string;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
