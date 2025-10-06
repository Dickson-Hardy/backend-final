import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QualityReviewsController } from './quality-reviews.controller';
import { QualityReviewsService } from './quality-reviews.service';
import { QualityReview, QualityReviewSchema } from './schemas/quality-review.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: QualityReview.name, schema: QualityReviewSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [QualityReviewsController],
  providers: [QualityReviewsService],
  exports: [QualityReviewsService],
})
export class QualityReviewsModule {}
