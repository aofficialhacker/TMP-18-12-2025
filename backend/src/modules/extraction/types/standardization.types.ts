/**
 * Value types for feature standardization
 */
export enum ValueType {
  TEXT = 'text',           // Free text (for descriptive features)
  NUMERIC = 'numeric',     // Pure numbers (days, count)
  BOOLEAN = 'boolean',     // Yes/No, Covered/Not Covered
  PERCENTAGE = 'percentage', // Percentage values (100%, 50% co-pay)
  CURRENCY = 'currency',   // Monetary values (Rs 5000, 1L, 1 Cr)
  ENUM = 'enum',           // Predefined options (room types, etc.)
}

/**
 * Standardization rules for a feature
 */
export interface StandardizationRules {
  // For ENUM type - predefined allowed values
  allowedValues?: string[];

  // Text-to-value mappings (for AI guidance and validation)
  // e.g., {"no limit": "NO_LIMIT", "not covered": "NOT_COVERED"}
  mappings?: Record<string, string | number>;

  // For NUMERIC/CURRENCY - normalization settings
  normalize?: {
    unit?: string;        // "days", "rupees", "lakhs"
    minValue?: number;
    maxValue?: number;
  };

  // Default value if not found or cannot be standardized
  defaultValue?: string | number;
}

/**
 * Result of standardization process
 */
export interface StandardizedFeature {
  featureId: number;
  featureName: string;
  extractedValue: string;      // Original raw text from PDF
  standardizedValue: string;   // Normalized/standardized value
  confidence: string;          // high/medium/low
}
