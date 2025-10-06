import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BoardController } from './board.controller';
import { BoardService } from './board.service';
import { BoardMember, BoardMemberSchema } from './schemas/board-member.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: BoardMember.name, schema: BoardMemberSchema }]),
  ],
  controllers: [BoardController],
  providers: [BoardService],
  exports: [BoardService],
})
export class BoardModule {}
