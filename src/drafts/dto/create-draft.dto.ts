import { IsString, IsArray, IsObject, IsOptional } from 'class-validator';

export class CreateDraftDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  manuscriptType?: string;

  @IsOptional()
  @IsArray()
  keywords?: string[];

  @IsOptional()
  @IsObject()
  sections?: {
    metadata: boolean;
    authors: boolean;
    abstract: boolean;
    manuscript: boolean;
    references: boolean;
  };

  @IsOptional()
  @IsObject()
  formData?: Record<string, any>;
}
