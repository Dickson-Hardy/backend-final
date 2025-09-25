import { Module } from "@nestjs/common"
import { MongooseModule } from "@nestjs/mongoose"
import { UsersController } from "./users.controller"
import { UsersService } from "./users.service"
import { User, UserSchema } from "./schemas/user.schema"
import { UploadModule } from "../upload/upload.module"
import { RolesGuard } from "../auth/guards/roles.guard"

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]), UploadModule],
  controllers: [UsersController],
  providers: [UsersService, RolesGuard],
  exports: [UsersService],
})
export class UsersModule {}
