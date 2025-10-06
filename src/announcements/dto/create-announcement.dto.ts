import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean, IsDateString, IsArray } from 'class-validator';
import { AnnouncementType } from '../schemas/announcement.schema';

export class CreateAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(AnnouncementType)
  @IsNotEmpty()
  type: AnnouncementType;

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;

  @IsDateString()
  @IsOptional()
  publishDate?: string;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @IsArray()
  @IsOptional()
  attachments?: string[];

  @IsArray()
  @IsOptional()
  tags?: string[];
}

export class UpdateAnnouncementDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsEnum(AnnouncementType)
  @IsOptional()
  type?: AnnouncementType;

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;

  @IsDateString()
  @IsOptional()
  publishDate?: string;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @IsArray()
  @IsOptional()
  attachments?: string[];

  @IsArray()
  @IsOptional()
  tags?: string[];
}
