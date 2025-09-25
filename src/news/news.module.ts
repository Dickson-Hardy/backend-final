import { Module } from "@nestjs/common"
import { MongooseModule } from "@nestjs/mongoose"
import { NewsController } from "./news.controller"
import { NewsService } from "./news.service"
import { News, NewsSchema } from "./schemas/news.schema"
import { UploadModule } from "../upload/upload.module"
import { RolesGuard } from "../auth/guards/roles.guard"

@Module({
  imports: [MongooseModule.forFeature([{ name: News.name, schema: NewsSchema }]), UploadModule],
  controllers: [NewsController],
  providers: [NewsService, RolesGuard],
  exports: [NewsService],
})
export class NewsModule {}
