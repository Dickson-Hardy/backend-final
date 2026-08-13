import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { MulterModule } from "@nestjs/platform-express"
import { UploadController } from "./upload.controller"
import { UploadService } from "./upload.service"
import { CloudflareR2StorageService } from "./services/cloudflare-r2.service"
import { RolesGuard } from "../auth/guards/roles.guard"
import * as multer from "multer"

@Module({
  imports: [
    ConfigModule,
    MulterModule.register({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit (R2 supports larger files)
      },
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService, CloudflareR2StorageService, RolesGuard],
  exports: [UploadService],
})
export class UploadModule {}
