import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { BoardService } from './board.service';
import { CreateBoardMemberDto } from './dto/create-board-member.dto';
import { UpdateBoardMemberDto } from './dto/update-board-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('editorial/board')
@UseGuards(JwtAuthGuard)
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.EDITOR_IN_CHIEF, UserRole.ADMIN)
  create(@Body() createDto: CreateBoardMemberDto) {
    return this.boardService.create(createDto);
  }

  @Get()
  findAll() {
    return this.boardService.findAll();
  }

  @Get('statistics')
  getStatistics() {
    return this.boardService.getStatistics();
  }

  @Get('role/:role')
  findByRole(@Param('role') role: string) {
    return this.boardService.findByRole(role);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.boardService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EDITOR_IN_CHIEF, UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateDto: UpdateBoardMemberDto) {
    return this.boardService.update(id, updateDto);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EDITOR_IN_CHIEF, UserRole.ADMIN)
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.boardService.updateStatus(id, body.status);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EDITOR_IN_CHIEF, UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    await this.boardService.delete(id);
    return { message: 'Board member deleted successfully' };
  }
}
