"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateFeatureDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_feature_dto_1 = require("./create-feature.dto");
class UpdateFeatureDto extends (0, mapped_types_1.PartialType)(create_feature_dto_1.CreateFeatureDto) {
}
exports.UpdateFeatureDto = UpdateFeatureDto;
//# sourceMappingURL=update-feature.dto.js.map