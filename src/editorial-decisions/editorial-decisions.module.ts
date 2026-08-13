import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EditorialDecisionsController } from './editorial-decisions.controller';
import { EditorialDecisionsService } from './editorial-decisions.service';
import {
  EditorialDecision,
  EditorialDecisionSchema,
} from './schemas/editorial-decision.schema';
import { Article, ArticleSchema } from '../articles/schemas/article.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EditorialDecision.name, schema: EditorialDecisionSchema },
      { name: Article.name, schema: ArticleSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [EditorialDecisionsController],
  providers: [EditorialDecisionsService],
  exports: [EditorialDecisionsService],
})
export class EditorialDecisionsModule {}
