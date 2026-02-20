import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsEnum, 
  IsMongoId, 
  IsBoolean, 
  IsNumber, 
  IsDateString, 
  Min, 
  Max, 
  MinLength,
  ValidateNested,
  IsObject
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ReviewRecommendation } from '../schemas/review.schema';

export class RatingsDto {
  @ApiProperty({ description: 'Originality rating (1-5)', minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  originality: number;

  @ApiProperty({ description: 'Methodology rating (1-5)', minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  methodology: number;

  @ApiProperty({ description: 'Significance rating (1-5)', minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  significance: number;

  @ApiProperty({ description: 'Clarity rating (1-5)', minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  clarity: number;

  @ApiProperty({ description: 'Overall rating (1-5)', minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  overall: number;
}

export class CreateReviewDto {
  @ApiProperty({ description: 'Article ID to review' })
  @IsMongoId()
  @IsNotEmpty()
  articleId: string;

  @ApiProperty({ description: 'Article title' })
  @IsString()
  @IsNotEmpty()
  articleTitle: string;

  @ApiProperty({ description: 'Reviewer user ID' })
  @IsMongoId()
  @IsNotEmpty()
  reviewerId: string;

  @ApiProperty({ description: 'Reviewer full name' })
  @IsString()
  @IsNotEmpty()
  reviewerName: string;

  @ApiProperty({ description: 'Review due date' })
  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @ApiProperty({ description: 'Anonymous review flag', required: false })
  @IsBoolean()
  @IsOptional()
  isAnonymous?: boolean;

  @ApiProperty({ description: 'Custom instructions', required: false })
  @IsString()
  @IsOptional()
  customInstructions?: string;
}

export class SubmitReviewDto {
  @ApiProperty({ enum: ReviewRecommendation, description: 'Review recommendation' })
  @IsEnum(ReviewRecommendation)
  @IsNotEmpty()
  recommendation: ReviewRecommendation;

  @ApiProperty({ description: 'Comments for authors (min 100 chars)', minLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MinLength(100, { message: 'Comments must be at least 100 characters' })
  comments: string;

  @ApiProperty({ description: 'Confidential comments for editor', required: false })
  @IsString()
  @IsOptional()
  confidentialComments?: string;

  @ApiProperty({ description: 'Manuscript strengths', required: false })
  @IsString()
  @IsOptional()
  strengths?: string;

  @ApiProperty({ description: 'Manuscript weaknesses', required: false })
  @IsString()
  @IsOptional()
  weaknesses?: string;

  @ApiProperty({ description: 'Suggestions for improvement', required: false })
  @IsString()
  @IsOptional()
  suggestions?: string;

  @ApiProperty({ description: 'Quality ratings', type: RatingsDto })
  @IsObject()
  @ValidateNested()
  @Type(() => RatingsDto)
  ratings: RatingsDto;

  @ApiProperty({ description: 'Attachment URLs', type: [String], required: false })
  @IsOptional()
  attachments?: string[];

  @ApiProperty({ description: 'Time spent (hours)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  timeSpentHours?: number;
}

export class UpdateReviewStatusDto {
  @IsEnum(['pending', 'in_progress', 'completed', 'declined', 'overdue'])
  @IsNotEmpty()
  status: string;

  @IsDateString()
  @IsOptional()
  submittedDate?: string;

  @IsDateString()
  @IsOptional()
  acceptedDate?: string;

  @IsDateString()
  @IsOptional()
  declinedDate?: string;
}
