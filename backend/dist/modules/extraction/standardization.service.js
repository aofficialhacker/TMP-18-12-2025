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
                return mappedValue.toString();
            }
            const aiStandardized = await this.geminiService.standardizeFeatureValue(extractedValue, feature.name, feature.valueType, feature.standardizationRules);
            return this.validateAgainstRules(aiStandardized, feature.valueType, feature.standardizationRules);
        }
        catch (error) {
            this.logger.error(`Error standardizing value for ${feature.name}: ${error.message}`);
            return feature.standardizationRules?.defaultValue?.toString() || 'ERROR';
        }
    }
    async standardizeBatch(extractedFeatures, features) {
        const featureMap = new Map(features.map(f => [f.id, f]));
        const results = [];
        let aiStandardizedMap = {};
        try {
            aiStandardizedMap =
                await this.geminiService.standardizeBatchOnce(extractedFeatures.map(f => ({
                    featureId: f.featureId,
                    featureName: f.featureName,
                    extractedValue: f.extractedValue,
                })));
        }
        catch (error) {
            this.logger.error(`Batch standardization failed, falling back to raw values: ${error.message}`);
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
            const standardizedValue = this.validateAgainstRules(aiValue, feature.valueType, feature.standardizationRules);
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
        if (!rules?.mappings)
            return null;
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
    validateAgainstRules(value, valueType, rules) {
        if (!value) {
            return rules?.defaultValue?.toString() || 'NOT_SPECIFIED';
        }
        switch (valueType) {
            case standardization_types_1.ValueType.ENUM:
                if (rules?.allowedValues) {
                    const upper = value.toUpperCase().replace(/\s+/g, '_');
                    return (rules.allowedValues.find(av => av.includes(upper) || upper.includes(av)) ||
                        rules.defaultValue?.toString() ||
                        'NOT_SPECIFIED');
                }
                return value.toUpperCase().replace(/\s+/g, '_');
            case standardization_types_1.ValueType.BOOLEAN:
                const v = value.toLowerCase();
                if (['yes', 'covered', 'available', 'included'].some(k => v.includes(k)))
                    return 'COVERED';
                if (['no', 'excluded', 'not covered'].some(k => v.includes(k)))
                    return 'NOT_COVERED';
                if (['partial', 'limited'].some(k => v.includes(k)))
                    return 'PARTIAL';
                return rules?.defaultValue?.toString() || 'NOT_SPECIFIED';
            case standardization_types_1.ValueType.NUMERIC:
                const num = value.match(/[\d,.]+/);
                if (num)
                    return parseFloat(num[0].replace(/,/g, '')).toString();
                return rules?.defaultValue?.toString() || '0';
            case standardization_types_1.ValueType.PERCENTAGE:
                const pct = value.match(/(\d+(\.\d+)?)/);
                return pct ? pct[1] : rules?.defaultValue?.toString() || '0';
            case standardization_types_1.ValueType.CURRENCY:
                return this.normalizeCurrency(value, rules);
            case standardization_types_1.ValueType.TEXT:
            default:
                return value;
        }
    }
    normalizeCurrency(value, rules) {
        const lower = value.toLowerCase();
        if (lower.includes('unlimited'))
            return '-1';
        const match = value.match(/[\d,]+(\.\d+)?/);
        if (!match)
            return rules?.defaultValue?.toString() || '0';
        let amount = parseFloat(match[0].replace(/,/g, ''));
        if (lower.includes('crore'))
            amount *= 100;
        else if (lower.includes('thousand'))
            amount /= 100;
        else if (amount > 10000)
            amount /= 100000;
        return Math.round(amount * 100) / 100 + '';
    }
};
exports.StandardizationService = StandardizationService;
exports.StandardizationService = StandardizationService = StandardizationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [gemini_service_1.GeminiService])
], StandardizationService);
//# sourceMappingURL=standardization.service.js.map