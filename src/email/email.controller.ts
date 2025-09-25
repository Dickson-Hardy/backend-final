import { Controller, Post, UseGuards } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger"
import { EmailService } from "./email.service"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../auth/guards/roles.guard"
import { Roles } from "../auth/decorators/roles.decorator"
import { UserRole } from "../users/schemas/user.schema"
import type { SendNewsletterDto } from "./dto/send-newsletter.dto"

@ApiTags("email")
@Controller("email")
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post("newsletter")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR_IN_CHIEF)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Send newsletter to subscribers" })
  @ApiResponse({ status: 200, description: "Newsletter sent successfully" })
  async sendNewsletter(sendNewsletterDto: SendNewsletterDto) {
    const { recipients, subject, content } = sendNewsletterDto
    return this.emailService.sendNewsletterAlert(recipients, subject, content)
  }

  @Post("test")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Send test email" })
  @ApiResponse({ status: 200, description: "Test email sent" })
  async sendTestEmail(body: { to: string; type: "resend" | "smtp" }) {
    const template = {
      html: "<h1>Test Email</h1><p>This is a test email from AMHSJ backend.</p>",
      text: "Test Email - This is a test email from AMHSJ backend.",
    }

    return this.emailService.sendEmail({
      to: body.to,
      subject: "AMHSJ Test Email",
      template,
      type: body.type === "resend" ? "alert" : "editorial",
    })
  }
}
