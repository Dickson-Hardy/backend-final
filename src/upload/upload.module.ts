import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { MulterModule } from "@nestjs/platform-express"
import { UploadController } from "./upload.controller"
import { UploadService } from "./upload.service"
import { GitHubStorageService } from "./services/github-storage.service"
import { RolesGuard } from "../auth/guards/roles.guard"
import * as multer from "multer"

@Module({
  imports: [
    ConfigModule,
    MulterModule.register({
      storage: multer.memoryStorage(), // Store files in memory as buffers
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService, GitHubStorageService, RolesGuard],
  exports: [UploadService],
})
export class UploadModule {}
