import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import { ValueType, StandardizationRules } from './types/standardization.types';

export interface ExtractedFeature {
  featureId: number;
  featureName: string;
  extractedValue: string;
  confidence: string;
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'your-gemini-api-key') {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    } else {
      this.logger.warn(
        'Gemini API key not configured. Feature extraction will use mock data.',
      );
    }
  }

  /* ===================== EXTRACTION ===================== */

  async extractFeaturesFromPdf(
    filePath: string,
    features: {
      id: number;
      name: string;
      extractionKeywords: string;
      extractionPrompt?: string;
    }[],
  ): Promise<ExtractedFeature[]> {
    if (!this.model) {
      this.logger.warn('Using mock extraction due to missing API key');
      return this.mockExtraction(features);
    }

    try {
      const pdfBuffer = fs.readFileSync(filePath);
      const pdfBase64 = pdfBuffer.toString('base64');

      const featuresList = features
        .map((f) =>
          f.extractionPrompt
            ? `- ${f.name} : ${f.extractionPrompt}`
            : `- Feature ID: ${f.id}, Name: "${f.name}", Search keywords: [${
                f.extractionKeywords
                  ? JSON.parse(f.extractionKeywords).join(', ')
                  : f.name
              }]`,
        )
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
    } catch (error) {
      this.logger.error(`Error extracting features: ${error.message}`);
      throw error;
    }
  }

  /* ===================== ✅ NEW: BATCH STANDARDIZATION ===================== */

  async standardizeBatchOnce(
    items: {
      featureId: number;
      featureName: string;
      extractedValue: string;
    }[],
  ): Promise<Record<number, string>> {
    if (!this.model) {
      this.logger.warn('Using mock batch standardization');
      return Object.fromEntries(
        items.map((i) => [i.featureId, i.extractedValue]),
      );
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
  .map(
    (i) =>
      `- ID: ${i.featureId}, Feature: ${i.featureName}, Value: "${i.extractedValue}"`,
  )
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
    } catch (error) {
      this.logger.error(
        `Error in batch standardization: ${error.message}`,
      );
      throw error;
    }
  }

  /* ===================== SINGLE STANDARDIZATION (UNCHANGED) ===================== */

  async standardizeFeatureValue(
    extractedValue: string,
    featureName: string,
    valueType: ValueType,
    rules: StandardizationRules | null,
  ): Promise<string> {
    if (!this.model) {
      return this.mockStandardization(extractedValue, valueType, rules);
    }

    try {
      const prompt = this.buildStandardizationPrompt(
        extractedValue,
        featureName,
        valueType,
        rules,
      );

      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text().trim();

      this.logger.debug(
        `Standardization response for "${featureName}": ${responseText}`,
      );

      return responseText.replace(/^["']|["']$/g, '').trim();
    } catch (error) {
      this.logger.error(`Error standardizing value: ${error.message}`);
      return rules?.defaultValue?.toString() || 'ERROR';
    }
  }

  /* ===================== HELPERS (UNCHANGED) ===================== */

  private buildStandardizationPrompt(
    extractedValue: string,
    featureName: string,
    valueType: ValueType,
    rules: StandardizationRules | null,
  ): string {
    let prompt = `
Feature: ${featureName}
Extracted Value: "${extractedValue}"
Expected Type: ${valueType}
`;

    prompt += `Return ONLY the standardized value.`;
    return prompt;
  }

  private mockExtraction(
    features: {
      id: number;
      name: string;
      extractionKeywords: string;
      extractionPrompt?: string;
    }[],
  ): ExtractedFeature[] {
    return features.map((f) => ({
      featureId: f.id,
      featureName: f.name,
      extractedValue: `[Mock] ${f.name}`,
      confidence: 'low',
    }));
  }

  private mockStandardization(
    extractedValue: string,
    valueType: ValueType,
    rules: StandardizationRules | null,
  ): string {
    return extractedValue || rules?.defaultValue?.toString() || 'NOT_SPECIFIED';
  }
}
