import { Injectable, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import * as nodemailer from "nodemailer"
import type { Transporter } from "nodemailer"
import type { EmailOptions } from "../interfaces/email.interface"

@Injectable()
export class SmtpService {
  private readonly logger = new Logger(SmtpService.name)
  private readonly transporter: Transporter

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>("SMTP_HOST"),
      port: this.configService.get<number>("SMTP_PORT"),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>("SMTP_USER"),
        pass: this.configService.get<string>("SMTP_PASS"),
      },
    })
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: `"AMHSJ Editorial Team" <${this.configService.get<string>("SMTP_USER")}>`,
        to: options.to,
        subject: options.subject,
        html: options.template.html,
        text: options.template.text,
      })

      this.logger.log(`Email sent via SMTP: ${info.messageId}`)
      return true
    } catch (error) {
      this.logger.error(`Failed to send email via SMTP: ${error.message}`)
      return false
    }
  }
}
