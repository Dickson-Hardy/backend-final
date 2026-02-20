import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReviewWorkflowController } from './review-workflow.controller';
import { ReviewWorkflowService } from './review-workflow.service';
import { Article, ArticleSchema } from '../articles/schemas/article.schema';
import { Review, ReviewSchema } from '../reviews/schemas/review.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { EditorialDecision, EditorialDecisionSchema } from '../editorial-decisions/schemas/editorial-decision.schema';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Article.name, schema: ArticleSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: User.name, schema: UserSchema },
      { name: EditorialDecision.name, schema: EditorialDecisionSchema },
    ]),
    EmailModule,
    NotificationsModule,
  ],
  controllers: [ReviewWorkflowController],
  providers: [ReviewWorkflowService],
  exports: [ReviewWorkflowService],
})
export class ReviewWorkflowModule {}