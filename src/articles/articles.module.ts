import { Module } from "@nestjs/common"
import { MongooseModule } from "@nestjs/mongoose"
import { ArticlesController } from "./articles.controller"
import { ArticlesService } from "./articles.service"
import { Article, ArticleSchema } from "./schemas/article.schema"
import { UploadModule } from "../upload/upload.module"
import { EmailModule } from "../email/email.module"
import { RolesGuard } from "../auth/guards/roles.guard"

@Module({
  imports: [MongooseModule.forFeature([{ name: Article.name, schema: ArticleSchema }]), UploadModule, EmailModule],
  controllers: [ArticlesController],
  providers: [ArticlesService, RolesGuard],
  exports: [ArticlesService],
})
export class ArticlesModule {}
