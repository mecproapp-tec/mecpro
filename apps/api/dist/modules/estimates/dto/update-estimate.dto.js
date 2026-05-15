"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateEstimateDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_estimate_dto_1 = require("./create-estimate.dto");
class UpdateEstimateDto extends (0, mapped_types_1.PartialType)(create_estimate_dto_1.CreateEstimateDto) {
}
exports.UpdateEstimateDto = UpdateEstimateDto;
//# sourceMappingURL=update-estimate.dto.js.map