import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BoardMember, BoardMemberDocument } from './schemas/board-member.schema';
import { CreateBoardMemberDto } from './dto/create-board-member.dto';
import { UpdateBoardMemberDto } from './dto/update-board-member.dto';

@Injectable()
export class BoardService {
  constructor(
    @InjectModel(BoardMember.name)
    private boardMemberModel: Model<BoardMemberDocument>,
  ) {}

  async create(createDto: CreateBoardMemberDto): Promise<BoardMember> {
    const existingMember = await this.boardMemberModel.findOne({ email: createDto.email });
    if (existingMember) {
      throw new ConflictException('A board member with this email already exists');
    }

    const member = new this.boardMemberModel(createDto);
    return member.save();
  }

  async findAll(): Promise<BoardMember[]> {
    return this.boardMemberModel.find().sort({ role: 1, name: 1 }).exec();
  }

  async findByRole(role: string): Promise<BoardMember[]> {
    return this.boardMemberModel.find({ role }).sort({ name: 1 }).exec();
  }

  async findOne(id: string): Promise<BoardMember> {
    const member = await this.boardMemberModel.findById(id).exec();
    if (!member) {
      throw new NotFoundException('Board member not found');
    }
    return member;
  }

  async update(id: string, updateDto: UpdateBoardMemberDto): Promise<BoardMember> {
    const member = await this.boardMemberModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .exec();

    if (!member) {
      throw new NotFoundException('Board member not found');
    }
    return member;
  }

  async updateStatus(id: string, status: string): Promise<BoardMember> {
    const member = await this.boardMemberModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .exec();

    if (!member) {
      throw new NotFoundException('Board member not found');
    }
    return member;
  }

  async delete(id: string): Promise<void> {
    const result = await this.boardMemberModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Board member not found');
    }
  }

  async getStatistics() {
    const total = await this.boardMemberModel.countDocuments();
    const byRole = await this.boardMemberModel.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);
    const byStatus = await this.boardMemberModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    return {
      total,
      byRole: byRole.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byStatus: byStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    };
  }
}
