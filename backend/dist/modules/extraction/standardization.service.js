"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var StandardizationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StandardizationService = void 0;
const common_1 = require("@nestjs/common");
const standardization_types_1 = require("./types/standardization.types");
const gemini_service_1 = require("./gemini.service");
let StandardizationService = StandardizationService_1 = class StandardizationService {
    constructor(geminiService) {
        this.geminiService = geminiService;
        this.logger = new common_1.Logger(StandardizationService_1.name);
    }
    async standardizeValue(extractedValue, feature) {
        if (!extractedValue || extractedValue.trim() === '') {
            return feature.standardizationRules?.defaultValue?.toString() || 'NOT_SPECIFIED';
        }
        try {
            const mappedValue = this.tryMappingMatch(extractedValue, feature.standardizationRules);
            if (mappedValue !== null) {
                this.logger.debug(`Mapped value found for "${extractedValue}": ${mappedValue}`);
                return mappedValue.toString();
            }
            const aiStandardized = await this.geminiService.standardizeFeatureValue(extractedValue, feature.name, feature.valueType, feature.standardizationRules);
            const validatedValue = this.validateAgainstRules(aiStandardized, feature.valueType, feature.standardizationRules);
            return validatedValue;
        }
        catch (error) {
            this.logger.error(`Error standardizing value for ${feature.name}: ${error.message}`);
            return feature.standardizationRules?.defaultValue?.toString() || 'ERROR';
        }
    }
    async standardizeBatch(extractedFeatures, features) {
        const featureMap = new Map(features.map((f) => [f.id, f]));
        const results = [];
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
    tryMappingMatch(extractedValue, rules) {
        if (!rules?.mappings) {
            return null;
        }
        const normalizedExtracted = extractedValue.toLowerCase().trim();
        if (rules.mappings[normalizedExtracted] !== undefined) {
            return rules.mappings[normalizedExtracted];
        }
        for (const [key, value] of Object.entries(rules.mappings)) {
            if (normalizedExtracted.includes(key.toLowerCase())) {
                return value;
            }
        }
        return null;
    }
    validateAgainstRules(value, valueType, rules) {
        if (!value) {
            return rules?.defaultValue?.toString() || 'NOT_SPECIFIED';
        }
        switch (valueType) {
            case standardization_types_1.ValueType.ENUM:
                if (rules?.allowedValues) {
                    const upperValue = value.toUpperCase().replace(/\s+/g, '_');
                    if (rules.allowedValues.includes(upperValue)) {
                        return upperValue;
                    }
                    const match = rules.allowedValues.find((av) => av.includes(upperValue) || upperValue.includes(av));
                    if (match) {
                        return match;
                    }
                    return rules.defaultValue?.toString() || 'NOT_SPECIFIED';
                }
                return value.toUpperCase().replace(/\s+/g, '_');
            case standardization_types_1.ValueType.BOOLEAN:
                const boolLower = value.toLowerCase();
                if (boolLower.includes('yes') ||
                    boolLower.includes('covered') ||
                    boolLower.includes('available') ||
                    boolLower.includes('included')) {
                    return 'COVERED';
                }
                if (boolLower.includes('no') ||
                    boolLower.includes('not covered') ||
                    boolLower.includes('not available') ||
                    boolLower.includes('excluded')) {
                    return 'NOT_COVERED';
                }
                if (boolLower.includes('partial') || boolLower.includes('limited')) {
                    return 'PARTIAL';
                }
                return rules?.defaultValue?.toString() || 'NOT_SPECIFIED';
            case standardization_types_1.ValueType.NUMERIC:
                const numMatch = value.match(/[\d,]+(\.\d+)?/);
                if (numMatch) {
                    const numValue = parseFloat(numMatch[0].replace(/,/g, ''));
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
                if (value.toLowerCase().includes('unlimited') || value.toLowerCase().includes('no limit')) {
                    return '-1';
                }
                return rules?.defaultValue?.toString() || '0';
            case standardization_types_1.ValueType.PERCENTAGE:
                const pctMatch = value.match(/(\d+(\.\d+)?)\s*%?/);
                if (pctMatch) {
                    return pctMatch[1];
                }
                return rules?.defaultValue?.toString() || '0';
            case standardization_types_1.ValueType.CURRENCY:
                return this.normalizeCurrency(value, rules);
            case standardization_types_1.ValueType.TEXT:
            default:
                return value;
        }
    }
    normalizeCurrency(value, rules) {
        const lowerValue = value.toLowerCase();
        if (lowerValue.includes('unlimited') || lowerValue.includes('no limit')) {
            return '-1';
        }
        const numMatch = value.match(/[\d,]+(\.\d+)?/);
        if (!numMatch) {
            return rules?.defaultValue?.toString() || '0';
        }
        let amount = parseFloat(numMatch[0].replace(/,/g, ''));
        if (lowerValue.includes('cr') || lowerValue.includes('crore')) {
            amount = amount * 100;
        }
        else if (lowerValue.includes('lakh') || lowerValue.includes('lac') || lowerValue.includes('l')) {
        }
        else if (lowerValue.includes('k') || lowerValue.includes('thousand')) {
            amount = amount / 100;
        }
        else if (amount > 10000) {
            amount = amount / 100000;
        }
        return Math.round(amount * 100) / 100 + '';
    }
};
exports.StandardizationService = StandardizationService;
exports.StandardizationService = StandardizationService = StandardizationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [gemini_service_1.GeminiService])
], StandardizationService);
//# sourceMappingURL=standardization.service.js.map