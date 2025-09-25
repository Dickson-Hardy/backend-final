import { IsString, IsArray, IsOptional, IsEnum, IsNotEmpty, MaxLength, IsEmail, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger'

export enum ArticleType {
  RESEARCH = 'research',
  REVIEW = 'review',
  CASE_STUDY = 'case_study',
  EDITORIAL = 'editorial',
  LETTER = 'letter',
}

export class AuthorDto {
  @ApiProperty({ description: 'Author name' })
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty({ description: 'Author email' })
  @IsEmail()
  email: string

  @ApiProperty({ description: 'Author affiliation', required: false })
  @IsOptional()
  @IsString()
  affiliation?: string
}

export class CreateArticleDto {
  @ApiProperty({ description: 'Article title' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string

  @ApiProperty({ description: 'Article abstract' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  abstract: string

  @ApiProperty({ description: 'Article content' })
  @IsString()
  @IsNotEmpty()
  content: string

  @ApiProperty({ description: 'Article keywords', type: [String] })
  @IsArray()
  @IsString({ each: true })
  keywords: string[]

  @ApiProperty({ enum: ArticleType, description: 'Article type' })
  @IsEnum(ArticleType)
  type: ArticleType

  @ApiProperty({ description: 'Article authors', type: [AuthorDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AuthorDto)
  authors: AuthorDto[]

  @ApiProperty({ description: 'Corresponding author email' })
  @IsEmail()
  correspondingAuthorEmail: string

  @ApiProperty({ description: 'Volume ID', required: false })
  @IsOptional()
  @IsString()
  volume?: string

  @ApiProperty({ description: 'Article categories', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[]

  @ApiProperty({ description: 'Acknowledgments', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  acknowledgments?: string

  @ApiProperty({ description: 'Conflict of interest statement', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  conflictOfInterest?: string

  @ApiProperty({ description: 'Funding information', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  funding?: string

  @ApiProperty({ description: 'References', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  references?: string[]
}
