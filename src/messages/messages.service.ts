import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
  ) {}

  async create(createMessageDto: CreateMessageDto, senderId: string, senderName: string, senderRole: string) {
    // Get recipient info - in production, you'd fetch this from the Users collection
    const message = new this.messageModel({
      ...createMessageDto,
      senderId: new Types.ObjectId(senderId),
      senderName,
      senderRole,
      recipientName: 'Recipient Name', // TODO: Fetch from user service
      recipientRole: 'Recipient Role', // TODO: Fetch from user service
    });

    return message.save();
  }

  async findAllForUser(userId: string, type: 'inbox' | 'sent' = 'inbox') {
    const query = type === 'inbox' 
      ? { recipientId: new Types.ObjectId(userId), isArchived: false }
      : { senderId: new Types.ObjectId(userId), isArchived: false };

    return this.messageModel
      .find(query)
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string, userId: string) {
    const message = await this.messageModel.findById(id).exec();

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Check if user has access to this message
    if (
      message.senderId.toString() !== userId &&
      message.recipientId.toString() !== userId
    ) {
      throw new ForbiddenException('You do not have access to this message');
    }

    return message;
  }

  async update(id: string, updateMessageDto: UpdateMessageDto, userId: string) {
    const message = await this.findOne(id, userId);

    // Only recipient can mark as read
    if (updateMessageDto.isRead !== undefined && message.recipientId.toString() !== userId) {
      throw new ForbiddenException('Only the recipient can mark messages as read');
    }

    Object.assign(message, updateMessageDto);
    return message.save();
  }

  async markAsRead(id: string, userId: string) {
    return this.update(id, { isRead: true }, userId);
  }

  async archive(id: string, userId: string) {
    return this.update(id, { isArchived: true }, userId);
  }

  async delete(id: string, userId: string) {
    const message = await this.findOne(id, userId);
    return this.messageModel.findByIdAndDelete(id).exec();
  }

  async getUnreadCount(userId: string) {
    return this.messageModel.countDocuments({
      recipientId: new Types.ObjectId(userId),
      isRead: false,
      isArchived: false,
    });
  }

  async getConversation(messageId: string, userId: string) {
    const message = await this.findOne(messageId, userId);
    
    // Find all messages in the thread
    const threadMessages = await this.messageModel
      .find({
        $or: [
          { _id: message.parentMessageId },
          { parentMessageId: message.parentMessageId || messageId },
          { _id: messageId },
        ],
      })
      .sort({ createdAt: 1 })
      .exec();

    return threadMessages;
  }

  async sendSystemMessage(
    recipientId: string,
    subject: string,
    body: string,
    relatedArticleId?: string,
    relatedArticleTitle?: string,
  ) {
    const systemMessage = new this.messageModel({
      senderId: new Types.ObjectId('000000000000000000000000'), // System user ID
      senderName: 'Journal Bot',
      senderRole: 'System Notification',
      recipientId: new Types.ObjectId(recipientId),
      recipientName: 'User', // TODO: Fetch from user service
      recipientRole: 'User', // TODO: Fetch from user service
      subject,
      body,
      relatedArticleId: relatedArticleId ? new Types.ObjectId(relatedArticleId) : undefined,
      relatedArticleTitle,
      attachments: [],
    });

    return systemMessage.save();
  }
}
