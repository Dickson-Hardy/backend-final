import { IsEnum } from 'class-validator';

export enum ReviewerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ON_LEAVE = 'on_leave',
}

export class UpdateReviewerStatusDto {
  @IsEnum(ReviewerStatus)
  status: ReviewerStatus;
}
