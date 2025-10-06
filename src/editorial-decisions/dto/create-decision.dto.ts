import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { DecisionType, Priority } from '../schemas/editorial-decision.schema';

export class CreateDecisionDto {
  @IsMongoId()
  articleId: string;

  @IsString()
  articleTitle: string;

  @IsString()
  authorName: string;

  @IsMongoId()
  @IsOptional()
  assignedTo?: string;

  @IsString()
  @IsOptional()
  assignedToName?: string;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @IsString()
  @IsOptional()
  notes?: string;
}
