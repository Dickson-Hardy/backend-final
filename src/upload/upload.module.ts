import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { UploadController } from "./upload.controller"
import { UploadService } from "./upload.service"
import { S3Service } from "./services/s3.service"
import { RolesGuard } from "../auth/guards/roles.guard"

@Module({
  imports: [ConfigModule],
  controllers: [UploadController],
  providers: [UploadService, S3Service, RolesGuard],
  exports: [UploadService],
})
export class UploadModule {}
