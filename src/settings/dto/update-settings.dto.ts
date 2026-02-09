import { IsObject, IsOptional } from "class-validator"
import { ApiProperty } from "@nestjs/swagger"

export class UpdateSettingsDto {
  @ApiProperty({ description: "Settings object", required: false })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>
}
