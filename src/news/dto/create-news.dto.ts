import { IsString, IsArray, IsOptional, IsEnum, IsNotEmpty, MaxLength, IsBoolean } from 'class-validator'

export enum NewsCategory {
  ANNOUNCEMENT = 'announcement',
  RESEARCH_UPDATE = 'research_update',
  CONFERENCE = 'conference',
  AWARD = 'award',
  EDITORIAL = 'editorial',
  GENERAL = 'general',
}

export class CreateNewsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string

  @IsString()
  @IsNotEmpty()
  content: string

  @IsString()
  @IsOptional()
  @MaxLength(500)
  excerpt?: string

  @IsEnum(NewsCategory)
  category: NewsCategory

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[]

  @IsBoolean()
  @IsOptional()
  published?: boolean = true

  @IsBoolean()
  @IsOptional()
  featured?: boolean = false
}
