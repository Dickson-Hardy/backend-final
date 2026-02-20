import { 
  IsString, 
  IsArray, 
  IsOptional, 
  IsEnum, 
  ValidateNested, 
  IsEmail, 
  IsNotEmpty, 
  MinLength, 
  ArrayMinSize, 
  MaxLength, 
  IsBoolean 
} from 'class-validator';
import { Type } from 'class-transformer';
import { ArticleType } from '../../articles/schemas/article.schema';
import { ApiProperty } from '@nestjs/swagger';

export class AuthorDto {
  @ApiProperty({ description: 'Author title (Dr., Prof., etc.)', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Author first name' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ description: 'Author last name' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ description: 'Author email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Author institutional affiliation' })
  @IsString()
  @IsNotEmpty()
  affiliation: string;

  @ApiProperty({ description: 'ORCID ID', required: false })
  @IsOptional()
  @IsString()
  orcid?: string;
}

export class RecommendedReviewerDto {
  @ApiProperty({ description: 'Reviewer full name with title' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Reviewer email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Reviewer institutional affiliation' })
  @IsString()
  @IsNotEmpty()
  affiliation: string;

  @ApiProperty({ description: 'Reviewer expertise areas' })
  @IsString()
  @IsNotEmpty()
  expertise: string;

  @ApiProperty({ description: 'Reason for recommendation' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ description: 'Conflict of interest declaration', required: false })
  @IsOptional()
  @IsBoolean()
  conflictOfInterest?: boolean;
}

export class CreateSubmissionDto {
  @ApiProperty({ description: 'Article title', minLength: 10, maxLength: 300 })
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Title must be at least 10 characters' })
  @MaxLength(300, { message: 'Title cannot exceed 300 characters' })
  title: string;

  @ApiProperty({ description: 'Article abstract', minLength: 100, maxLength: 3000 })
  @IsString()
  @IsNotEmpty()
  @MinLength(100, { message: 'Abstract must be at least 100 characters' })
  @MaxLength(3000, { message: 'Abstract cannot exceed 3000 characters' })
  abstract: string;

  @ApiProperty({ description: 'Article content', minLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MinLength(500, { message: 'Content must be at least 500 characters' })
  content: string;

  @ApiProperty({ description: 'Article keywords (minimum 3)', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(3, { message: 'At least 3 keywords are required' })
  keywords: string[];

  @ApiProperty({ enum: ArticleType, description: 'Article type' })
  @IsEnum(ArticleType)
  type: ArticleType;

  @ApiProperty({ description: 'List of authors (minimum 1)', type: [AuthorDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AuthorDto)
  @ArrayMinSize(1, { message: 'At least one author is required' })
  authors: AuthorDto[];

  @ApiProperty({ description: 'Email of the corresponding author' })
  @IsEmail()
  @IsNotEmpty()
  correspondingAuthorEmail: string;

  @ApiProperty({ description: 'Recommended reviewers (optional)', type: [RecommendedReviewerDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecommendedReviewerDto)
  recommendedReviewers?: RecommendedReviewerDto[];

  @ApiProperty({ description: 'Volume ID', required: false })
  @IsOptional()
  @IsString()
  volume?: string;

  @ApiProperty({ description: 'Article categories', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiProperty({ description: 'Conflict of interest statement', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  conflictOfInterest?: string;

  @ApiProperty({ description: 'Funding information', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  funding?: string;

  @ApiProperty({ description: 'Acknowledgments', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  acknowledgments?: string;

  @ApiProperty({ description: 'References', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  references?: string[];

  @ApiProperty({ description: 'Cover letter', required: false })
  @IsOptional()
  @IsString()
  coverLetter?: string;

  @ApiProperty({ description: 'Draft ID if converting from draft', required: false })
  @IsOptional()
  @IsString()
  draftId?: string;

  @ApiProperty({ description: 'Research ethics approval', required: false })
  @IsOptional()
  @IsBoolean()
  ethicsApproval?: boolean;

  @ApiProperty({ description: 'Ethics approval number', required: false })
  @IsOptional()
  @IsString()
  ethicsApprovalNumber?: string;
}