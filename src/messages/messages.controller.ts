import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  create(@Body() createMessageDto: CreateMessageDto, @Request() req) {
    return this.messagesService.create(
      createMessageDto,
      req.user.id,
      req.user.name,
      req.user.role,
    );
  }

  @Get()
  findAll(@Request() req, @Query('type') type: 'inbox' | 'sent' = 'inbox') {
    return this.messagesService.findAllForUser(req.user.id, type);
  }

  @Get('unread-count')
  getUnreadCount(@Request() req) {
    return this.messagesService.getUnreadCount(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.messagesService.findOne(id, req.user.id);
  }

  @Get(':id/conversation')
  getConversation(@Param('id') id: string, @Request() req) {
    return this.messagesService.getConversation(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateMessageDto: UpdateMessageDto,
    @Request() req,
  ) {
    return this.messagesService.update(id, updateMessageDto, req.user.id);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Request() req) {
    return this.messagesService.markAsRead(id, req.user.id);
  }

  @Patch(':id/archive')
  archive(@Param('id') id: string, @Request() req) {
    return this.messagesService.archive(id, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.messagesService.delete(id, req.user.id);
  }
}
