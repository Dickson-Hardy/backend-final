import { IsString, IsDateString, IsOptional, IsBoolean } from 'class-validator';

export class AssignReviewerDto {
  @IsString()
  articleId: string;

  @IsString()
  reviewerId: string;

  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @IsOptional()
  @IsString()
  instructions?: string;
}