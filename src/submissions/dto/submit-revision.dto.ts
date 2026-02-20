import { IsString, IsOptional, IsArray } from 'class-validator';

export class SubmitRevisionDto {
  @IsString()
  revisionNotes: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  abstract?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @IsString()
  responseToReviewers?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  changesHighlighted?: string[];
}