import { Injectable, Logger } from '@nestjs/common';
import { Feature } from '../../entities/feature.entity';
import {
  ValueType,
  StandardizationRules,
  StandardizedFeature,
} from './types/standardization.types';
import { GeminiService, ExtractedFeature } from './gemini.service';

@Injectable()
export class StandardizationService {
  private readonly logger = new Logger(StandardizationService.name);

  constructor(private readonly geminiService: GeminiService) {}

  /**
   * Standardize a single extracted value (UNCHANGED)
   */
  async standardizeValue(
    extractedValue: string,
    feature: Feature,
  ): Promise<string> {
    if (!extractedValue || extractedValue.trim() === '') {
      return feature.standardizationRules?.defaultValue?.toString() || 'NOT_SPECIFIED';
    }

    try {
      const mappedValue = this.tryMappingMatch(
        extractedValue,
        feature.standardizationRules,
      );

      if (mappedValue !== null) {
        return mappedValue.toString();
      }

      const aiStandardized =
        await this.geminiService.standardizeFeatureValue(
          extractedValue,
          feature.name,
          feature.valueType,
          feature.standardizationRules,
        );

      return this.validateAgainstRules(
        aiStandardized,
        feature.valueType,
        feature.standardizationRules,
      );
    } catch (error) {
      this.logger.error(
        `Error standardizing value for ${feature.name}: ${error.message}`,
      );
      return feature.standardizationRules?.defaultValue?.toString() || 'ERROR';
    }
  }

  /**
   * ✅ FIXED: Standardize batch with ONLY ONE Gemini call
   */
  async standardizeBatch(
    extractedFeatures: ExtractedFeature[],
    features: Feature[],
  ): Promise<StandardizedFeature[]> {
    const featureMap = new Map(features.map(f => [f.id, f]));
    const results: StandardizedFeature[] = [];

    let aiStandardizedMap: Record<number, string> = {};

    // 🔹 ONE Gemini call for ALL features
    try {
      aiStandardizedMap =
        await this.geminiService.standardizeBatchOnce(
          extractedFeatures.map(f => ({
            featureId: f.featureId,
            featureName: f.featureName,
            extractedValue: f.extractedValue,
          })),
        );
    } catch (error) {
      this.logger.error(
        `Batch standardization failed, falling back to raw values: ${error.message}`,
      );
    }

    for (const ef of extractedFeatures) {
      const feature = featureMap.get(ef.featureId);

      if (!feature) {
        results.push({
          featureId: ef.featureId,
          featureName: ef.featureName,
          extractedValue: ef.extractedValue,
          standardizedValue: 'FEATURE_NOT_FOUND',
          confidence: 'low',
        });
        continue;
      }

      const aiValue = aiStandardizedMap[ef.featureId] || ef.extractedValue;

      const standardizedValue = this.validateAgainstRules(
        aiValue,
        feature.valueType,
        feature.standardizationRules,
      );

      results.push({
        featureId: ef.featureId,
        featureName: ef.featureName,
        extractedValue: ef.extractedValue,
        standardizedValue,
        confidence: ef.confidence,
      });
    }

    return results;
  }

  /* ===================== HELPERS (UNCHANGED) ===================== */

  private tryMappingMatch(
    extractedValue: string,
    rules: StandardizationRules | null,
  ): string | number | null {
    if (!rules?.mappings) return null;

    const normalized = extractedValue.toLowerCase().trim();

    if (rules.mappings[normalized] !== undefined) {
      return rules.mappings[normalized];
    }

    for (const [key, value] of Object.entries(rules.mappings)) {
      if (normalized.includes(key.toLowerCase())) {
        return value;
      }
    }

    return null;
  }

  private validateAgainstRules(
    value: string,
    valueType: ValueType,
    rules: StandardizationRules | null,
  ): string {
    if (!value) {
      return rules?.defaultValue?.toString() || 'NOT_SPECIFIED';
    }

    switch (valueType) {
      case ValueType.ENUM:
        if (rules?.allowedValues) {
          const upper = value.toUpperCase().replace(/\s+/g, '_');
          return (
            rules.allowedValues.find(
              av => av.includes(upper) || upper.includes(av),
            ) ||
            rules.defaultValue?.toString() ||
            'NOT_SPECIFIED'
          );
        }
        return value.toUpperCase().replace(/\s+/g, '_');

      case ValueType.BOOLEAN:
        const v = value.toLowerCase();
        if (['yes', 'covered', 'available', 'included'].some(k => v.includes(k)))
          return 'COVERED';
        if (['no', 'excluded', 'not covered'].some(k => v.includes(k)))
          return 'NOT_COVERED';
        if (['partial', 'limited'].some(k => v.includes(k)))
          return 'PARTIAL';
        return rules?.defaultValue?.toString() || 'NOT_SPECIFIED';

      case ValueType.NUMERIC:
        const num = value.match(/[\d,.]+/);
        if (num) return parseFloat(num[0].replace(/,/g, '')).toString();
        return rules?.defaultValue?.toString() || '0';

      case ValueType.PERCENTAGE:
        const pct = value.match(/(\d+(\.\d+)?)/);
        return pct ? pct[1] : rules?.defaultValue?.toString() || '0';

      case ValueType.CURRENCY:
        return this.normalizeCurrency(value, rules);

      case ValueType.TEXT:
      default:
        return value;
    }
  }

  private normalizeCurrency(
    value: string,
    rules: StandardizationRules | null,
  ): string {
    const lower = value.toLowerCase();
    if (lower.includes('unlimited')) return '-1';

    const match = value.match(/[\d,]+(\.\d+)?/);
    if (!match) return rules?.defaultValue?.toString() || '0';

    let amount = parseFloat(match[0].replace(/,/g, ''));

    if (lower.includes('crore')) amount *= 100;
    else if (lower.includes('thousand')) amount /= 100;
    else if (amount > 10000) amount /= 100000;

    return Math.round(amount * 100) / 100 + '';
  }
}
