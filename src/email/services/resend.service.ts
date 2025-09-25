import { Injectable, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { Resend } from "resend"
import type { EmailOptions } from "../interfaces/email.interface"

@Injectable()
export class ResendService {
  private readonly logger = new Logger(ResendService.name)
  private readonly resend: Resend | null

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>("RESEND_API_KEY")
    if (!apiKey) {
      this.logger.warn("RESEND_API_KEY not configured - ResendService will be disabled")
      this.resend = null
    } else {
      this.resend = new Resend(apiKey)
      this.logger.log("ResendService initialized successfully")
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!this.resend) {
        this.logger.warn("ResendService is disabled - RESEND_API_KEY not configured")
        return false
      }

      const { data, error } = await this.resend.emails.send({
        from: "AMHSJ <noreply@amhsj.org>",
        to: options.to,
        subject: options.subject,
        html: options.template.html,
        text: options.template.text,
      })

      if (error) {
        this.logger.error(`Resend error: ${error.message}`)
        return false
      }

      this.logger.log(`Email sent via Resend: ${data.id}`)
      return true
    } catch (error) {
      this.logger.error(`Failed to send email via Resend: ${error.message}`)
      return false
    }
  }
}
