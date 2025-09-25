import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { EmailService } from "./email.service"
import { ResendService } from "./services/resend.service"
import { SmtpService } from "./services/smtp.service"
import { EmailController } from "./email.controller"
import { RolesGuard } from "../auth/guards/roles.guard"

@Module({
  imports: [ConfigModule],
  providers: [EmailService, ResendService, SmtpService, RolesGuard],
  controllers: [EmailController],
  exports: [EmailService],
})
export class EmailModule {}
