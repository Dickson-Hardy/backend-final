import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { UploadController } from "./upload.controller"
import { UploadService } from "./upload.service"
import { GitHubStorageService } from "./services/github-storage.service"
import { RolesGuard } from "../auth/guards/roles.guard"

@Module({
  imports: [ConfigModule],
  controllers: [UploadController],
  providers: [UploadService, GitHubStorageService, RolesGuard],
  exports: [UploadService],
})
export class UploadModule {}
