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
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
