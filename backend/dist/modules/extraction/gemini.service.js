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
let GeminiService = GeminiService_1 = class GeminiService {
    constructor() {
        this.logger = new common_1.Logger(GeminiService_1.name);
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey && apiKey !== 'your-gemini-api-key') {
            this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
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
                .map((f) => f.extractionPrompt
                ? `- ${f.name} : ${f.extractionPrompt}`
                : `- Feature ID: ${f.id}, Name: "${f.name}", Search keywords: [${f.extractionKeywords
                    ? JSON.parse(f.extractionKeywords).join(', ')
                    : f.name}]`)
                .join('\n');
            const prompt = `
You are analyzing a health insurance policy brochure PDF.

Extract the following features and return ONLY valid JSON array.

${featuresList}

Format:
[
  {
    "featureId": <number>,
    "featureName": "<string>",
    "extractedValue": "<string>",
    "confidence": "<high|medium|low>"
  }
]
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
            const cleaned = responseText
                .replace(/```json/g, '')
                .replace(/```/g, '')
                .trim();
            return JSON.parse(cleaned);
        }
        catch (error) {
            this.logger.error(`Error extracting features: ${error.message}`);
            throw error;
        }
    }
    async standardizeBatchOnce(items) {
        if (!this.model) {
            this.logger.warn('Using mock batch standardization');
            return Object.fromEntries(items.map((i) => [i.featureId, i.extractedValue]));
        }
        try {
            const prompt = `
You are standardizing health insurance feature values.

For EACH item below, return a standardized value.

Return ONLY valid JSON object in this format:
{
  "<featureId>": "<standardizedValue>"
}

Items:
${items
                .map((i) => `- ID: ${i.featureId}, Feature: ${i.featureName}, Value: "${i.extractedValue}"`)
                .join('\n')}

Rules:
- Be concise
- No explanations
- No markdown
- No extra text
`;
            const result = await this.model.generateContent(prompt);
            const responseText = result.response.text().trim();
            this.logger.debug(`Batch standardization response: ${responseText}`);
            const cleaned = responseText
                .replace(/```json/g, '')
                .replace(/```/g, '')
                .trim();
            return JSON.parse(cleaned);
        }
        catch (error) {
            this.logger.error(`Error in batch standardization: ${error.message}`);
            throw error;
        }
    }
    async standardizeFeatureValue(extractedValue, featureName, valueType, rules) {
        if (!this.model) {
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
        let prompt = `
Feature: ${featureName}
Extracted Value: "${extractedValue}"
Expected Type: ${valueType}
`;
        prompt += `Return ONLY the standardized value.`;
        return prompt;
    }
    mockExtraction(features) {
        return features.map((f) => ({
            featureId: f.id,
            featureName: f.name,
            extractedValue: `[Mock] ${f.name}`,
            confidence: 'low',
        }));
    }
    mockStandardization(extractedValue, valueType, rules) {
        return extractedValue || rules?.defaultValue?.toString() || 'NOT_SPECIFIED';
    }
};
exports.GeminiService = GeminiService;
exports.GeminiService = GeminiService = GeminiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], GeminiService);
//# sourceMappingURL=gemini.service.js.map