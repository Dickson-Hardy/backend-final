import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EditorialDecisionsController } from './editorial-decisions.controller';
import { EditorialDecisionsService } from './editorial-decisions.service';
import {
  EditorialDecision,
  EditorialDecisionSchema,
} from './schemas/editorial-decision.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EditorialDecision.name, schema: EditorialDecisionSchema },
    ]),
  ],
  controllers: [EditorialDecisionsController],
  providers: [EditorialDecisionsService],
  exports: [EditorialDecisionsService],
})
export class EditorialDecisionsModule {}
