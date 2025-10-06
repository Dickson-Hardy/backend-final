import { IsString, IsNotEmpty, IsOptional, IsArray, IsMongoId } from 'class-validator';

export class CreateMessageDto {
  @IsMongoId()
  @IsNotEmpty()
  recipientId: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsArray()
  @IsOptional()
  attachments?: Array<{ name: string; size: string; url: string }>;

  @IsMongoId()
  @IsOptional()
  relatedArticleId?: string;

  @IsString()
  @IsOptional()
  relatedArticleTitle?: string;

  @IsMongoId()
  @IsOptional()
  parentMessageId?: string;
}
