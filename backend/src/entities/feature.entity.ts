import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Category } from './category.entity';
import { PlanFeatureValue } from './plan-feature-value.entity';
import { ValueType, StandardizationRules } from '../modules/extraction/types/standardization.types';

@Entity('features')
@Unique(['displayOrder'])
export class Feature {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'category_id' })
  categoryId: number;

  @ManyToOne(() => Category, (category) => category.features, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', default: 0 })
  weightage: number;

  @Column({ name: 'extraction_keywords', type: 'text', nullable: true })
  extractionKeywords: string; // JSON array of keywords

  @Column({ name: 'extraction_prompt', type: 'text', nullable: true })
  extractionPrompt: string;

  @Column({
    name: 'value_type',
    type: 'enum',
    enum: ValueType,
    default: ValueType.TEXT,
  })
  valueType: ValueType;

  @Column({ name: 'standardization_rules', type: 'json', nullable: true })
  standardizationRules: StandardizationRules;

  @Column({ name: 'display_order', type: 'int', default: 1 })
  displayOrder: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => PlanFeatureValue, (pfv) => pfv.feature)
  planFeatureValues: PlanFeatureValue[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
