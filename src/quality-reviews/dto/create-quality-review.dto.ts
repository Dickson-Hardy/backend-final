import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';

export class CreateQualityReviewDto {
  @IsString()
  articleId: string;

  @IsString()
  title: string;

  @IsString()
  submittedBy: string;

  @IsOptional()
  @IsEnum(['low', 'normal', 'high', 'urgent'])
  priority?: string;

  @IsOptional()
  @IsObject()
  issues?: {
    formatting: number;
    plagiarism: number;
    language: number;
    references: number;
  };
}
