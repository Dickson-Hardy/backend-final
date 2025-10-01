import { IsString, IsOptional, IsEnum, IsArray, IsBoolean, ValidateNested, IsEmail } from 'class-validator'
import { Type } from 'class-transformer'
import { ArticleStatus, ArticleType } from '../../articles/schemas/article.schema'

class AuthorDto {
  @IsString()
  @IsOptional()
  title?: string

  @IsString()
  firstName: string

  @IsString()
  lastName: string

  @IsEmail()
  email: string

  @IsString()
  affiliation: string
}

export class AdminUpdateArticleDto {
  @IsString()
  @IsOptional()
  title?: string

  @IsString()
  @IsOptional()
  abstract?: string

  @IsString()
  @IsOptional()
  content?: string

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords?: string[]

  @IsEnum(ArticleType)
  @IsOptional()
  type?: ArticleType

  @IsEnum(ArticleStatus)
  @IsOptional()
  status?: ArticleStatus

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AuthorDto)
  @IsOptional()
  authors?: AuthorDto[]

  @IsString()
  @IsOptional()
  volume?: string

  @IsString()
  @IsOptional()
  doi?: string

  @IsString()
  @IsOptional()
  pages?: string

  @IsString()
  @IsOptional()
  articleNumber?: string

  @IsBoolean()
  @IsOptional()
  featured?: boolean

  @IsString()
  @IsOptional()
  conflictOfInterest?: string

  @IsString()
  @IsOptional()
  funding?: string

  @IsString()
  @IsOptional()
  acknowledgments?: string

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categories?: string[]

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  references?: string[]
}
