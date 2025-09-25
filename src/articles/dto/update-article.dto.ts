import { PartialType } from '@nestjs/mapped-types'
import { CreateArticleDto } from './create-article.dto'
import { IsBoolean, IsOptional, IsString } from 'class-validator'

export class UpdateArticleDto extends PartialType(CreateArticleDto) {
  @IsBoolean()
  @IsOptional()
  featured?: boolean

  @IsString()
  @IsOptional()
  volume?: string

  @IsString()
  @IsOptional()
  doi?: string

  @IsString()
  @IsOptional()
  pages?: string
}
