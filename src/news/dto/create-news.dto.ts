import { IsString, IsArray, IsOptional, IsEnum, IsNotEmpty, MaxLength, IsBoolean, IsDateString } from 'class-validator'
import { NewsPriority, NewsStatus, NewsType } from '../schemas/news.schema'

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

  @IsEnum(NewsType)
  type: NewsType

  @IsEnum(NewsPriority)
  @IsOptional()
  priority?: NewsPriority = NewsPriority.MEDIUM

  @IsEnum(NewsStatus)
  @IsOptional()
  status?: NewsStatus = NewsStatus.DRAFT

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[]

  @IsDateString()
  @IsOptional()
  publishDate?: string

  @IsDateString()
  @IsOptional()
  expiryDate?: string

  @IsBoolean()
  @IsOptional()
  featured?: boolean = false
}
