import { Feature } from '../../entities/feature.entity';
import { StandardizedFeature } from './types/standardization.types';
import { GeminiService, ExtractedFeature } from './gemini.service';
export declare class StandardizationService {
    private readonly geminiService;
    private readonly logger;
    constructor(geminiService: GeminiService);
    standardizeValue(extractedValue: string, feature: Feature): Promise<string>;
    standardizeBatch(extractedFeatures: ExtractedFeature[], features: Feature[]): Promise<StandardizedFeature[]>;
    private tryMappingMatch;
    private validateAgainstRules;
    private normalizeCurrency;
}
