import { Module } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { MongooseModule } from "@nestjs/mongoose"
import { AuthModule } from "./auth/auth.module"
import { UsersModule } from "./users/users.module"
import { ArticlesModule } from "./articles/articles.module"
import { VolumesModule } from "./volumes/volumes.module"
import { NewsModule } from "./news/news.module"
import { EmailModule } from "./email/email.module"
import { UploadModule } from "./upload/upload.module"
import { StatisticsModule } from "./statistics/statistics.module"
import { AdminModule } from "./admin/admin.module"
import { MessagesModule } from "./messages/messages.module"
import { NotificationsModule } from "./notifications/notifications.module"
import { ReviewsModule } from "./reviews/reviews.module"
import { AnnouncementsModule } from "./announcements/announcements.module"
import { DraftsModule } from "./drafts/drafts.module"
import { QualityReviewsModule } from "./quality-reviews/quality-reviews.module"
import { BoardModule } from "./board/board.module"
import { AnalyticsModule } from "./analytics/analytics.module"
import { EditorialDecisionsModule } from "./editorial-decisions/editorial-decisions.module"
import { SettingsModule } from "./settings/settings.module"
import { SubmissionsModule } from "./submissions/submissions.module"
import { ReviewWorkflowModule } from "./review-workflow/review-workflow.module"
import { AppController } from "./app.controller"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI') || "mongodb://localhost:27017/amhsj",
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    ArticlesModule,
    VolumesModule,
    NewsModule,
    EmailModule,
    UploadModule,
    StatisticsModule,
    AdminModule,
    MessagesModule,
    NotificationsModule,
    ReviewsModule,
    AnnouncementsModule,
    DraftsModule,
    QualityReviewsModule,
    BoardModule,
    AnalyticsModule,
    EditorialDecisionsModule,
    SettingsModule,
    SubmissionsModule,
    ReviewWorkflowModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
