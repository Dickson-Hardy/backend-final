import { IsEmail, IsMongoId, IsString, IsOptional } from 'class-validator';

export class InviteReviewerDto {
  @IsMongoId()
  articleId: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  message?: string;
}
