import { IsString, IsNumber, IsEnum, IsOptional, IsBoolean, IsDateString } from "class-validator"
import { ApiProperty } from "@nestjs/swagger"
import { VolumeStatus } from "../schemas/volume.schema"

export class CreateVolumeDto {
  @ApiProperty({ description: "Volume number" })
  @IsNumber({}, { message: 'Volume must be a number' })
  volume: number

  @ApiProperty({ description: "Issue number", required: false })
  @IsOptional()
  @IsNumber({}, { message: 'Issue must be a number' })
  issue?: number

  @ApiProperty({ description: "Publication year" })
  @IsNumber({}, { message: 'Year must be a number' })
  year: number

  @ApiProperty({ description: "Volume title" })
  @IsString()
  title: string

  @ApiProperty({ description: "Volume description", required: false })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({ enum: VolumeStatus, description: "Volume status" })
  @IsEnum(VolumeStatus)
  status: VolumeStatus

  @ApiProperty({ description: "Cover image URL", required: false })
  @IsOptional()
  @IsString()
  coverImage?: string

  @ApiProperty({ description: "Publication date", required: false })
  @IsOptional()
  @IsDateString()
  publishDate?: string

  @ApiProperty({ description: "DOI", required: false })
  @IsOptional()
  @IsString()
  doi?: string

  @ApiProperty({ description: "Page range", required: false })
  @IsOptional()
  @IsString()
  pages?: string

  @ApiProperty({ description: "Editor ID", required: false })
  @IsOptional()
  @IsString()
  editor?: string

  @ApiProperty({ description: "ISSN", required: false })
  @IsOptional()
  @IsString()
  issn?: string

  @ApiProperty({ description: "ISBN", required: false })
  @IsOptional()
  @IsString()
  isbn?: string

  @ApiProperty({ description: "Featured volume", required: false })
  @IsOptional()
  @IsBoolean()
  featured?: boolean
}
