import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DecisionType, DecisionStatus, Priority } from '../schemas/editorial-decision.schema';

export class UpdateDecisionDto {
  @IsEnum(DecisionStatus)
  @IsOptional()
  status?: DecisionStatus;

  @IsEnum(DecisionType)
  @IsOptional()
  decision?: DecisionType;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  comments?: string;
}
