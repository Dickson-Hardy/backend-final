import { Module } from "@nestjs/common"
import { MongooseModule } from "@nestjs/mongoose"
import { VolumesController } from "./volumes.controller"
import { VolumesService } from "./volumes.service"
import { Volume, VolumeSchema } from "./schemas/volume.schema"
import { Article, ArticleSchema } from "../articles/schemas/article.schema"
import { RolesGuard } from "../auth/guards/roles.guard"

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Volume.name, schema: VolumeSchema },
      { name: Article.name, schema: ArticleSchema }
    ])
  ],
  controllers: [VolumesController],
  providers: [VolumesService, RolesGuard],
  exports: [VolumesService],
})
export class VolumesModule {}
