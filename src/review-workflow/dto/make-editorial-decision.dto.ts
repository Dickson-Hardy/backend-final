import { IsEnum, IsString, IsOptional } from 'class-validator';
import { DecisionType } from '../../editorial-decisions/schemas/editorial-decision.schema';

export class MakeEditorialDecisionDto {
  @IsEnum(DecisionType)
  decision: DecisionType;

  @IsString()
  comments: string;

  @IsOptional()
  @IsString()
  feedbackToAuthor?: string;

  @IsOptional()
  @IsString()
  confidentialNotes?: string;
}