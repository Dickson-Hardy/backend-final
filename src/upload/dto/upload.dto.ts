import { IsString, IsOptional, IsEnum } from "class-validator"
import { ApiProperty } from "@nestjs/swagger"

export enum FileType {
  MANUSCRIPT = "manuscript",
  IMAGE = "image",
  SUPPLEMENTARY = "supplementary",
  PROFILE = "profile",
  COVER = "cover",
  NEWS = "news",
}

export class UploadFileDto {
  @ApiProperty({ enum: FileType, description: "Type of file being uploaded" })
  @IsEnum(FileType)
  type: FileType

  @ApiProperty({ description: "User ID (for profile images)", required: false })
  @IsOptional()
  @IsString()
  userId?: string

  @ApiProperty({ description: "Article ID (for manuscripts)", required: false })
  @IsOptional()
  @IsString()
  articleId?: string

  @ApiProperty({ description: "Volume ID (for covers)", required: false })
  @IsOptional()
  @IsString()
  volumeId?: string

  @ApiProperty({ type: "string", format: "binary", description: "File to upload" })
  file: any
}
