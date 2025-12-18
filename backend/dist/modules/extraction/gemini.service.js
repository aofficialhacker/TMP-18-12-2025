"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var GeminiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiService = void 0;
const common_1 = require("@nestjs/common");
const generative_ai_1 = require("@google/generative-ai");
const fs = __importStar(require("fs"));
const standardization_types_1 = require("./types/standardization.types");
let GeminiService = GeminiService_1 = class GeminiService {
    constructor() {
        this.logger = new common_1.Logger(GeminiService_1.name);
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey && apiKey !== 'your-gemini-api-key') {
            this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
        }
        else {
            this.logger.warn('Gemini API key not configured. Feature extraction will use mock data.');
        }
    }
    async extractFeaturesFromPdf(filePath, features) {
        if (!this.model) {
            this.logger.warn('Using mock extraction due to missing API key');
            return this.mockExtraction(features);
        }
        try {
            const pdfBuffer = fs.readFileSync(filePath);
            const pdfBase64 = pdfBuffer.toString('base64');
            const featuresList = features
                .map((f) => {
                if (f.extractionPrompt) {
                    return `- ${f.name} : ${f.extractionPrompt}`;
                }
                else {
                    const keywords = f.extractionKeywords
                        ? JSON.parse(f.extractionKeywords).join(', ')
                        : f.name;
                    return `- Feature ID: ${f.id}, Name: "${f.name}", Search keywords: [${keywords}]`;
                }
            })
                .join('\n');
            const prompt = `
You are analyzing a health insurance policy brochure PDF. Extract specific information for each feature listed below.

For each feature, the format is "Feature Name : extraction instruction". Follow the instruction to extract the appropriate value.
If a feature is not found or not applicable, indicate "Not Found" or "Not Covered".

Features to extract:
${featuresList}

IMPORTANT: Return your response as a valid JSON array only, with no additional text, markdown formatting, or code blocks. The format should be:
[
  {
    "featureId": <number>,
    "featureName": "<string>",
    "extractedValue": "<string - the actual value following the extraction instruction>",
    "confidence": "<high/medium/low>"
  }
]

Be thorough and extract exact values, limits, percentages, and coverage details when available.
`;
            const result = await this.model.generateContent([
                {
                    inlineData: {
                        mimeType: 'application/pdf',
                        data: pdfBase64,
                    },
                },
                prompt,
            ]);
            const responseText = result.response.text();
            this.logger.debug(`Gemini response: ${responseText}`);
            const cleanedResponse = responseText
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();
            const extractedFeatures = JSON.parse(cleanedResponse);
            return extractedFeatures;
        }
        catch (error) {
            this.logger.error(`Error extracting features: ${error.message}`);
            throw error;
        }
    }
    mockExtraction(features) {
        return features.map((f) => ({
            featureId: f.id,
            featureName: f.name,
            extractedValue: `[Mock] Sample value for ${f.name} - Configure GEMINI_API_KEY for real extraction`,
            confidence: 'low',
        }));
    }
    async standardizeFeatureValue(extractedValue, featureName, valueType, rules) {
        if (!this.model) {
            this.logger.warn('Using mock standardization due to missing API key');
            return this.mockStandardization(extractedValue, valueType, rules);
        }
        try {
            const prompt = this.buildStandardizationPrompt(extractedValue, featureName, valueType, rules);
            const result = await this.model.generateContent(prompt);
            const responseText = result.response.text().trim();
            this.logger.debug(`Standardization response for "${featureName}": ${responseText}`);
            return responseText.replace(/^["']|["']$/g, '').trim();
        }
        catch (error) {
            this.logger.error(`Error standardizing value: ${error.message}`);
            return rules?.defaultValue?.toString() || 'ERROR';
        }
    }
    buildStandardizationPrompt(extractedValue, featureName, valueType, rules) {
        let prompt = `You are standardizing health insurance policy feature values.

Feature Name: ${featureName}
Extracted Value: "${extractedValue}"
Expected Value Type: ${valueType}

`;
        switch (valueType) {
            case standardization_types_1.ValueType.ENUM:
                prompt += `Allowed standardized values: ${rules?.allowedValues?.join(', ') || 'Any valid category'}

Based on the extracted value, return ONLY the most appropriate standardized value from the allowed list.
If the value indicates the feature is not covered, return "NOT_COVERED".
If unclear, return "${rules?.defaultValue || 'NOT_SPECIFIED'}".`;
                break;
            case standardization_types_1.ValueType.BOOLEAN:
                prompt += `Return ONLY one of: COVERED, NOT_COVERED, PARTIAL, LIMITED

- COVERED: If the feature is fully available/included
- NOT_COVERED: If the feature is not available/excluded
- PARTIAL: If the feature is partially covered with conditions
- LIMITED: If coverage is limited to specific scenarios`;
                break;
            case standardization_types_1.ValueType.NUMERIC:
                prompt += `Return ONLY a numeric value.
${rules?.normalize?.unit ? `Unit: ${rules.normalize.unit}` : ''}

Extract the numeric value from the text.
- If "unlimited" or "no limit", return "-1"
- If not specified, return "${rules?.defaultValue || '0'}"
- Return just the number, no text`;
                break;
            case standardization_types_1.ValueType.PERCENTAGE:
                prompt += `Return ONLY a numeric percentage value (without % symbol).

- Extract the percentage from the text
- If "100%" return "100"
- If "no co-pay", return "100" (meaning 100% covered)
- If not specified, return "${rules?.defaultValue || '0'}"`;
                break;
            case standardization_types_1.ValueType.CURRENCY:
                prompt += `Return ONLY a numeric value in Lakhs (Indian currency).

- Convert Crores to Lakhs (1 Cr = 100 Lakhs)
- Convert thousands to Lakhs (divide by 100)
- If "unlimited", return "-1"
- Return just the number, no currency symbols`;
                break;
            default:
                prompt += `Return a clean, standardized version of the value.`;
        }
        if (rules?.mappings) {
            prompt += `\n\nKnown mappings for guidance:\n`;
            for (const [key, value] of Object.entries(rules.mappings)) {
                prompt += `- "${key}" -> "${value}"\n`;
            }
        }
        prompt += `\n\nIMPORTANT: Return ONLY the standardized value, nothing else. No explanations, no quotes unless part of the value.`;
        return prompt;
    }
    mockStandardization(extractedValue, valueType, rules) {
        const lowerValue = extractedValue.toLowerCase();
        switch (valueType) {
            case standardization_types_1.ValueType.BOOLEAN:
                if (lowerValue.includes('yes') || lowerValue.includes('covered')) {
                    return 'COVERED';
                }
                if (lowerValue.includes('no') || lowerValue.includes('not')) {
                    return 'NOT_COVERED';
                }
                return 'NOT_SPECIFIED';
            case standardization_types_1.ValueType.ENUM:
                if (rules?.allowedValues?.length) {
                    return rules.allowedValues[0];
                }
                return 'NOT_SPECIFIED';
            case standardization_types_1.ValueType.NUMERIC:
            case standardization_types_1.ValueType.PERCENTAGE:
                const numMatch = extractedValue.match(/\d+/);
                return numMatch ? numMatch[0] : '0';
            case standardization_types_1.ValueType.CURRENCY:
                return '0';
            default:
                return extractedValue;
        }
    }
};
exports.GeminiService = GeminiService;
exports.GeminiService = GeminiService = GeminiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], GeminiService);
//# sourceMappingURL=gemini.service.js.map