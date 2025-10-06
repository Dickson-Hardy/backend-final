import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Announcement, AnnouncementDocument, AnnouncementType } from './schemas/announcement.schema';
import { CreateAnnouncementDto, UpdateAnnouncementDto } from './dto/create-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectModel(Announcement.name)
    private announcementModel: Model<AnnouncementDocument>,
  ) {}

  async create(
    createAnnouncementDto: CreateAnnouncementDto,
    userId: string,
    userName: string,
  ) {
    const announcement = new this.announcementModel({
      ...createAnnouncementDto,
      createdBy: new Types.ObjectId(userId),
      createdByName: userName,
      publishDate: createAnnouncementDto.publishDate
        ? new Date(createAnnouncementDto.publishDate)
        : new Date(),
      expiryDate: createAnnouncementDto.expiryDate
        ? new Date(createAnnouncementDto.expiryDate)
        : undefined,
    });

    return announcement.save();
  }

  async findAll(includeUnpublished: boolean = false, type?: AnnouncementType) {
    const query: any = {};

    if (!includeUnpublished) {
      query.isPublished = true;
      query.$or = [
        { expiryDate: { $exists: false } },
        { expiryDate: null },
        { expiryDate: { $gte: new Date() } },
      ];
    }

    if (type) {
      query.type = type;
    }

    return this.announcementModel
      .find(query)
      .sort({ isPinned: -1, publishDate: -1 })
      .exec();
  }

  async findOne(id: string, incrementViews: boolean = false) {
    const announcement = await this.announcementModel.findById(id).exec();

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    if (incrementViews) {
      announcement.views += 1;
      await announcement.save();
    }

    return announcement;
  }

  async update(id: string, updateAnnouncementDto: UpdateAnnouncementDto) {
    const announcement = await this.findOne(id);

    Object.assign(announcement, {
      ...updateAnnouncementDto,
      publishDate: updateAnnouncementDto.publishDate
        ? new Date(updateAnnouncementDto.publishDate)
        : announcement.publishDate,
      expiryDate: updateAnnouncementDto.expiryDate
        ? new Date(updateAnnouncementDto.expiryDate)
        : announcement.expiryDate,
    });

    return announcement.save();
  }

  async togglePublish(id: string) {
    const announcement = await this.findOne(id);
    announcement.isPublished = !announcement.isPublished;
    return announcement.save();
  }

  async togglePin(id: string) {
    const announcement = await this.findOne(id);
    announcement.isPinned = !announcement.isPinned;
    return announcement.save();
  }

  async delete(id: string) {
    const announcement = await this.findOne(id);
    return this.announcementModel.findByIdAndDelete(id).exec();
  }

  async getPinnedAnnouncements() {
    return this.announcementModel
      .find({
        isPinned: true,
        isPublished: true,
        $or: [
          { expiryDate: { $exists: false } },
          { expiryDate: null },
          { expiryDate: { $gte: new Date() } },
        ],
      })
      .sort({ publishDate: -1 })
      .limit(5)
      .exec();
  }

  async getRecentAnnouncements(limit: number = 10) {
    return this.announcementModel
      .find({
        isPublished: true,
        $or: [
          { expiryDate: { $exists: false } },
          { expiryDate: null },
          { expiryDate: { $gte: new Date() } },
        ],
      })
      .sort({ publishDate: -1 })
      .limit(limit)
      .exec();
  }
}
