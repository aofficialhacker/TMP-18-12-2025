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
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
    } else {
      this.logger.warn('Gemini API key not configured. Feature extraction will use mock data.');
    }
  }

  async extractFeaturesFromPdf(
    filePath: string,
    features: { id: number; name: string; extractionKeywords: string; extractionPrompt?: string }[],
  ): Promise<ExtractedFeature[]> {
    if (!this.model) {
      this.logger.warn('Using mock extraction due to missing API key');
      return this.mockExtraction(features);
    }

    try {
      // Read PDF file as base64
      const pdfBuffer = fs.readFileSync(filePath);
      const pdfBase64 = pdfBuffer.toString('base64');

      // Build the prompt for feature extraction
      const featuresList = features
        .map((f) => {
          if (f.extractionPrompt) {
            // Use extraction prompt if available
            return `- ${f.name} : ${f.extractionPrompt}`;
          } else {
            // Fallback to keywords
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

      // Call Gemini API with PDF
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

      // Parse the JSON response
      const cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const extractedFeatures: ExtractedFeature[] = JSON.parse(cleanedResponse);
      return extractedFeatures;
    } catch (error) {
      this.logger.error(`Error extracting features: ${error.message}`);
      throw error;
    }
  }

  private mockExtraction(
    features: { id: number; name: string; extractionKeywords: string; extractionPrompt?: string }[],
  ): ExtractedFeature[] {
    // Return mock data for testing without API key
    return features.map((f) => ({
      featureId: f.id,
      featureName: f.name,
      extractedValue: `[Mock] Sample value for ${f.name} - Configure GEMINI_API_KEY for real extraction`,
      confidence: 'low',
    }));
  }

  /**
   * Standardize an extracted feature value using AI interpretation
   */
  async standardizeFeatureValue(
    extractedValue: string,
    featureName: string,
    valueType: ValueType,
    rules: StandardizationRules | null,
  ): Promise<string> {
    if (!this.model) {
      this.logger.warn('Using mock standardization due to missing API key');
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

      this.logger.debug(`Standardization response for "${featureName}": ${responseText}`);

      // Clean up the response - remove any quotes or extra formatting
      return responseText.replace(/^["']|["']$/g, '').trim();
    } catch (error) {
      this.logger.error(`Error standardizing value: ${error.message}`);
      return rules?.defaultValue?.toString() || 'ERROR';
    }
  }

  /**
   * Build the prompt for value standardization
   */
  private buildStandardizationPrompt(
    extractedValue: string,
    featureName: string,
    valueType: ValueType,
    rules: StandardizationRules | null,
  ): string {
    let prompt = `You are standardizing health insurance policy feature values.

Feature Name: ${featureName}
Extracted Value: "${extractedValue}"
Expected Value Type: ${valueType}

`;

    switch (valueType) {
      case ValueType.ENUM:
        prompt += `Allowed standardized values: ${rules?.allowedValues?.join(', ') || 'Any valid category'}

Based on the extracted value, return ONLY the most appropriate standardized value from the allowed list.
If the value indicates the feature is not covered, return "NOT_COVERED".
If unclear, return "${rules?.defaultValue || 'NOT_SPECIFIED'}".`;
        break;

      case ValueType.BOOLEAN:
        prompt += `Return ONLY one of: COVERED, NOT_COVERED, PARTIAL, LIMITED

- COVERED: If the feature is fully available/included
- NOT_COVERED: If the feature is not available/excluded
- PARTIAL: If the feature is partially covered with conditions
- LIMITED: If coverage is limited to specific scenarios`;
        break;

      case ValueType.NUMERIC:
        prompt += `Return ONLY a numeric value.
${rules?.normalize?.unit ? `Unit: ${rules.normalize.unit}` : ''}

Extract the numeric value from the text.
- If "unlimited" or "no limit", return "-1"
- If not specified, return "${rules?.defaultValue || '0'}"
- Return just the number, no text`;
        break;

      case ValueType.PERCENTAGE:
        prompt += `Return ONLY a numeric percentage value (without % symbol).

- Extract the percentage from the text
- If "100%" return "100"
- If "no co-pay", return "100" (meaning 100% covered)
- If not specified, return "${rules?.defaultValue || '0'}"`;
        break;

      case ValueType.CURRENCY:
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

  /**
   * Mock standardization for when API key is not configured
   */
  private mockStandardization(
    extractedValue: string,
    valueType: ValueType,
    rules: StandardizationRules | null,
  ): string {
    const lowerValue = extractedValue.toLowerCase();

    switch (valueType) {
      case ValueType.BOOLEAN:
        if (lowerValue.includes('yes') || lowerValue.includes('covered')) {
          return 'COVERED';
        }
        if (lowerValue.includes('no') || lowerValue.includes('not')) {
          return 'NOT_COVERED';
        }
        return 'NOT_SPECIFIED';

      case ValueType.ENUM:
        if (rules?.allowedValues?.length) {
          return rules.allowedValues[0]; // Return first allowed value as mock
        }
        return 'NOT_SPECIFIED';

      case ValueType.NUMERIC:
      case ValueType.PERCENTAGE:
        const numMatch = extractedValue.match(/\d+/);
        return numMatch ? numMatch[0] : '0';

      case ValueType.CURRENCY:
        return '0';

      default:
        return extractedValue;
    }
  }
}
