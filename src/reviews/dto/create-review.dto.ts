import { IsString, IsNotEmpty, IsOptional, IsEnum, IsMongoId, IsBoolean, IsNumber, IsDateString, Min, Max } from 'class-validator';
import { ReviewRecommendation } from '../schemas/review.schema';

export class CreateReviewDto {
  @IsMongoId()
  @IsNotEmpty()
  articleId: string;

  @IsString()
  @IsNotEmpty()
  articleTitle: string;

  @IsMongoId()
  @IsNotEmpty()
  reviewerId: string;

  @IsString()
  @IsNotEmpty()
  reviewerName: string;

  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @IsBoolean()
  @IsOptional()
  isAnonymous?: boolean;
}

export class SubmitReviewDto {
  @IsEnum(ReviewRecommendation)
  @IsNotEmpty()
  recommendation: ReviewRecommendation;

  @IsString()
  @IsNotEmpty()
  comments: string;

  @IsString()
  @IsOptional()
  confidentialComments?: string;

  @IsOptional()
  ratings?: {
    originality?: number;
    methodology?: number;
    significance?: number;
    clarity?: number;
    overall?: number;
  };

  @IsOptional()
  attachments?: string[];
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
