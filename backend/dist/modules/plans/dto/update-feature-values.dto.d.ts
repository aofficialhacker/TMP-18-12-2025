export declare class FeatureValueDto {
    featureId: number;
    extractedValue?: string;
    verifiedValue?: string;
    isVerified?: boolean;
}
export declare class UpdateFeatureValuesDto {
    featureValues: FeatureValueDto[];
}
