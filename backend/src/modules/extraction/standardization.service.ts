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
   * Standardize a single extracted value based on feature configuration
   */
  async standardizeValue(
    extractedValue: string,
    feature: Feature,
  ): Promise<string> {
    if (!extractedValue || extractedValue.trim() === '') {
      return feature.standardizationRules?.defaultValue?.toString() || 'NOT_SPECIFIED';
    }

    try {
      // First, try to match against predefined mappings
      const mappedValue = this.tryMappingMatch(extractedValue, feature.standardizationRules);
      if (mappedValue !== null) {
        this.logger.debug(`Mapped value found for "${extractedValue}": ${mappedValue}`);
        return mappedValue.toString();
      }

      // If no mapping match, use AI to interpret and standardize
      const aiStandardized = await this.geminiService.standardizeFeatureValue(
        extractedValue,
        feature.name,
        feature.valueType,
        feature.standardizationRules,
      );

      // Validate AI result against rules
      const validatedValue = this.validateAgainstRules(
        aiStandardized,
        feature.valueType,
        feature.standardizationRules,
      );

      return validatedValue;
    } catch (error) {
      this.logger.error(`Error standardizing value for ${feature.name}: ${error.message}`);
      return feature.standardizationRules?.defaultValue?.toString() || 'ERROR';
    }
  }

  /**
   * Standardize a batch of extracted features
   */
  async standardizeBatch(
    extractedFeatures: ExtractedFeature[],
    features: Feature[],
  ): Promise<StandardizedFeature[]> {
    const featureMap = new Map(features.map((f) => [f.id, f]));
    const results: StandardizedFeature[] = [];

    for (const ef of extractedFeatures) {
      const feature = featureMap.get(ef.featureId);
      if (!feature) {
        this.logger.warn(`Feature ${ef.featureId} not found for standardization`);
        results.push({
          featureId: ef.featureId,
          featureName: ef.featureName,
          extractedValue: ef.extractedValue,
          standardizedValue: 'FEATURE_NOT_FOUND',
          confidence: 'low',
        });
        continue;
      }

      const standardizedValue = await this.standardizeValue(ef.extractedValue, feature);

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

  /**
   * Try to match extracted value against predefined mappings
   */
  private tryMappingMatch(
    extractedValue: string,
    rules: StandardizationRules | null,
  ): string | number | null {
    if (!rules?.mappings) {
      return null;
    }

    const normalizedExtracted = extractedValue.toLowerCase().trim();

    // Check for exact match
    if (rules.mappings[normalizedExtracted] !== undefined) {
      return rules.mappings[normalizedExtracted];
    }

    // Check for partial match (if extracted value contains the mapping key)
    for (const [key, value] of Object.entries(rules.mappings)) {
      if (normalizedExtracted.includes(key.toLowerCase())) {
        return value;
      }
    }

    return null;
  }

  /**
   * Validate standardized value against feature rules
   */
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
        // Validate against allowed values
        if (rules?.allowedValues) {
          const upperValue = value.toUpperCase().replace(/\s+/g, '_');
          if (rules.allowedValues.includes(upperValue)) {
            return upperValue;
          }
          // Try to find a close match
          const match = rules.allowedValues.find(
            (av) => av.includes(upperValue) || upperValue.includes(av),
          );
          if (match) {
            return match;
          }
          return rules.defaultValue?.toString() || 'NOT_SPECIFIED';
        }
        return value.toUpperCase().replace(/\s+/g, '_');

      case ValueType.BOOLEAN:
        // Normalize to COVERED/NOT_COVERED or YES/NO
        const boolLower = value.toLowerCase();
        if (
          boolLower.includes('yes') ||
          boolLower.includes('covered') ||
          boolLower.includes('available') ||
          boolLower.includes('included')
        ) {
          return 'COVERED';
        }
        if (
          boolLower.includes('no') ||
          boolLower.includes('not covered') ||
          boolLower.includes('not available') ||
          boolLower.includes('excluded')
        ) {
          return 'NOT_COVERED';
        }
        if (boolLower.includes('partial') || boolLower.includes('limited')) {
          return 'PARTIAL';
        }
        return rules?.defaultValue?.toString() || 'NOT_SPECIFIED';

      case ValueType.NUMERIC:
        // Extract numeric value
        const numMatch = value.match(/[\d,]+(\.\d+)?/);
        if (numMatch) {
          const numValue = parseFloat(numMatch[0].replace(/,/g, ''));
          // Apply min/max constraints if defined
          if (rules?.normalize) {
            if (rules.normalize.minValue !== undefined && numValue < rules.normalize.minValue) {
              return rules.normalize.minValue.toString();
            }
            if (rules.normalize.maxValue !== undefined && numValue > rules.normalize.maxValue) {
              return rules.normalize.maxValue.toString();
            }
          }
          return numValue.toString();
        }
        // Check for special keywords
        if (value.toLowerCase().includes('unlimited') || value.toLowerCase().includes('no limit')) {
          return '-1'; // Convention: -1 means unlimited
        }
        return rules?.defaultValue?.toString() || '0';

      case ValueType.PERCENTAGE:
        // Extract percentage value
        const pctMatch = value.match(/(\d+(\.\d+)?)\s*%?/);
        if (pctMatch) {
          return pctMatch[1];
        }
        return rules?.defaultValue?.toString() || '0';

      case ValueType.CURRENCY:
        // Normalize currency to base unit (e.g., rupees)
        return this.normalizeCurrency(value, rules);

      case ValueType.TEXT:
      default:
        return value;
    }
  }

  /**
   * Normalize currency values to a standard format (in Lakhs)
   */
  private normalizeCurrency(value: string, rules: StandardizationRules | null): string {
    const lowerValue = value.toLowerCase();

    // Check for unlimited/no limit
    if (lowerValue.includes('unlimited') || lowerValue.includes('no limit')) {
      return '-1';
    }

    // Extract numeric value
    const numMatch = value.match(/[\d,]+(\.\d+)?/);
    if (!numMatch) {
      return rules?.defaultValue?.toString() || '0';
    }

    let amount = parseFloat(numMatch[0].replace(/,/g, ''));

    // Detect and normalize multipliers
    if (lowerValue.includes('cr') || lowerValue.includes('crore')) {
      amount = amount * 100; // Convert to Lakhs
    } else if (lowerValue.includes('lakh') || lowerValue.includes('lac') || lowerValue.includes('l')) {
      // Already in Lakhs
    } else if (lowerValue.includes('k') || lowerValue.includes('thousand')) {
      amount = amount / 100; // Convert thousands to Lakhs
    } else if (amount > 10000) {
      // Assume raw rupees, convert to Lakhs
      amount = amount / 100000;
    }

    // Round to 2 decimal places
    return Math.round(amount * 100) / 100 + '';
  }
}
