import { PartialType } from '@nestjs/mapped-types';
import { CreateQualityReviewDto } from './create-quality-review.dto';
import { IsString, IsOptional } from 'class-validator';

export class UpdateQualityReviewDto extends PartialType(CreateQualityReviewDto) {
  @IsOptional()
  @IsString()
  notes?: string;
}
