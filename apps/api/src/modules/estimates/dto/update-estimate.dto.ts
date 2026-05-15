// apps/api/src/modules/estimates/dto/update-estimate.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateEstimateDto } from './create-estimate.dto';

export class UpdateEstimateDto extends PartialType(CreateEstimateDto) {}