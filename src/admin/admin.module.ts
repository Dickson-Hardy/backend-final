import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'
import { User, UserSchema } from '../users/schemas/user.schema'
import { Article, ArticleSchema } from '../articles/schemas/article.schema'
import { Volume, VolumeSchema } from '../volumes/schemas/volume.schema'
import { UploadModule } from '../upload/upload.module'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Article.name, schema: ArticleSchema },
      { name: Volume.name, schema: VolumeSchema },
    ]),
    UploadModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}


