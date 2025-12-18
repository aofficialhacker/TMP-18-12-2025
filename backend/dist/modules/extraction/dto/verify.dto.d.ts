export declare class VerifiedFeatureDto {
    featureId: number;
    extractedValue: string;
    verifiedValue: string;
    isVerified?: boolean;
}
export declare class VerifyExtractionDto {
    companyId?: number;
    planId?: number;
    planName?: string;
    featureValues: VerifiedFeatureDto[];
}
