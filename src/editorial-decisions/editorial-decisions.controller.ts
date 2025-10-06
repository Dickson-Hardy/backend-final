import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { EditorialDecisionsService } from './editorial-decisions.service';
import { CreateDecisionDto } from './dto/create-decision.dto';
import { UpdateDecisionDto } from './dto/update-decision.dto';
import { MakeDecisionDto } from './dto/make-decision.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { DecisionStatus } from './schemas/editorial-decision.schema';

@Controller('editorial/decisions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.EDITOR_IN_CHIEF,
  UserRole.ASSOCIATE_EDITOR,
  UserRole.EDITORIAL_BOARD,
  UserRole.ADMIN,
)
export class EditorialDecisionsController {
  constructor(
    private readonly editorialDecisionsService: EditorialDecisionsService,
  ) {}

  @Post()
  @Roles(UserRole.EDITOR_IN_CHIEF, UserRole.ADMIN)
  create(@Body() createDecisionDto: CreateDecisionDto) {
    return this.editorialDecisionsService.create(createDecisionDto);
  }

  @Get()
  findAll(
    @Query('status') status?: DecisionStatus,
    @Query('priority') priority?: string,
  ) {
    return this.editorialDecisionsService.findAll(status, priority);
  }

  @Get('statistics')
  getStatistics() {
    return this.editorialDecisionsService.getStatistics();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.editorialDecisionsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.EDITOR_IN_CHIEF, UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateDecisionDto: UpdateDecisionDto) {
    return this.editorialDecisionsService.update(id, updateDecisionDto);
  }

  @Post(':id/decide')
  @Roles(UserRole.EDITOR_IN_CHIEF, UserRole.ADMIN)
  makeDecision(
    @Param('id') id: string,
    @Body() makeDecisionDto: MakeDecisionDto,
    @Request() req,
  ) {
    return this.editorialDecisionsService.makeDecision(
      id,
      makeDecisionDto,
      req.user.userId,
      req.user.name || req.user.email,
    );
  }

  @Post(':id/recommend')
  addRecommendation(
    @Param('id') id: string,
    @Body('recommendation') recommendation: string,
  ) {
    return this.editorialDecisionsService.addRecommendation(id, recommendation);
  }

  @Delete(':id')
  @Roles(UserRole.EDITOR_IN_CHIEF, UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.editorialDecisionsService.delete(id);
  }
}
