/**
 * Single plan shown in comparison
 * NOTE:
 * - premium & sumInsured come from USER INPUT
 * - NOT from DB
 */
export interface ComparisonPlan {
  planId: number;
  companyName: string;
  companyLogo?: string;
  planName: string;
  sumInsured: number;
  premium: number;
}

/**
 * Feature displayed on left side
 * description is used for ℹ️ tooltip
 */
export interface ComparisonFeature {
  id: number;
  name: string;
  description?: string;
}

/**
 * Final comparison response from backend
 */
export interface ComparisonResult {
  clientDetails?: {
    name?: string;
    dob?: string;
    age?: number;
    preExistingDisease?: string;
    planType?: string;
    policyType?: string;
  };

  /**
   * Plans shown as columns
   */
  plans: ComparisonPlan[];

  /**
   * Active features (rows)
   */
  features: ComparisonFeature[];

  /**
   * Feature value matrix
   * featureId -> planId -> value
   */
  featureValues: {
    [featureId: number]: {
      [planId: number]: string;
    };
  };

  /**
   * Terms & Conditions block
   */
  terms?: {
    text: string[];
    irDAI: string;
    validity: string;
    ibaiMembershipNo: string;
  };
}
