import { IsString, IsArray, IsEmail } from "class-validator"
import { ApiProperty } from "@nestjs/swagger"

export class SendNewsletterDto {
  @ApiProperty({ description: "Newsletter subject" })
  @IsString()
  subject: string

  @ApiProperty({ description: "Newsletter content (HTML)" })
  @IsString()
  content: string

  @ApiProperty({ description: "Recipient email addresses", type: [String] })
  @IsArray()
  @IsEmail({}, { each: true })
  recipients: string[]
}
