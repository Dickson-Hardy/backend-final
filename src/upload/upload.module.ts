import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { UploadController } from "./upload.controller"
import { UploadService } from "./upload.service"
import { CloudinaryService } from "./services/cloudinary.service"
import { RolesGuard } from "../auth/guards/roles.guard"

@Module({
  imports: [ConfigModule],
  controllers: [UploadController],
  providers: [UploadService, CloudinaryService, RolesGuard],
  exports: [UploadService],
})
export class UploadModule {}
