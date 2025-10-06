import { IsEnum, IsString } from 'class-validator';
import { DecisionType } from '../schemas/editorial-decision.schema';

export class MakeDecisionDto {
  @IsEnum(DecisionType)
  decision: DecisionType;

  @IsString()
  comments: string;
}
