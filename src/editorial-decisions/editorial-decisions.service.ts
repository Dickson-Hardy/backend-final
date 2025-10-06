import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  EditorialDecision,
  EditorialDecisionDocument,
  DecisionStatus,
  DecisionType,
} from './schemas/editorial-decision.schema';
import { CreateDecisionDto } from './dto/create-decision.dto';
import { UpdateDecisionDto } from './dto/update-decision.dto';
import { MakeDecisionDto } from './dto/make-decision.dto';

@Injectable()
export class EditorialDecisionsService {
  constructor(
    @InjectModel(EditorialDecision.name)
    private decisionModel: Model<EditorialDecisionDocument>,
  ) {}

  async create(createDecisionDto: CreateDecisionDto) {
    const decision = await this.decisionModel.create({
      ...createDecisionDto,
      articleId: new Types.ObjectId(createDecisionDto.articleId),
      assignedTo: createDecisionDto.assignedTo
        ? new Types.ObjectId(createDecisionDto.assignedTo)
        : undefined,
      submittedDate: new Date(),
      status: DecisionStatus.PENDING,
    });

    return decision;
  }

  async findAll(status?: DecisionStatus, priority?: string) {
    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    return this.decisionModel
      .find(query)
      .sort({ priority: -1, submittedDate: 1 })
      .exec();
  }

  async findOne(id: string) {
    const decision = await this.decisionModel.findById(id).exec();

    if (!decision) {
      throw new NotFoundException('Editorial decision not found');
    }

    return decision;
  }

  async update(id: string, updateDecisionDto: UpdateDecisionDto) {
    const decision = await this.decisionModel.findByIdAndUpdate(
      id,
      updateDecisionDto,
      { new: true },
    );

    if (!decision) {
      throw new NotFoundException('Editorial decision not found');
    }

    return decision;
  }

  async makeDecision(
    id: string,
    makeDecisionDto: MakeDecisionDto,
    userId: string,
    userName: string,
  ) {
    const decision = await this.decisionModel.findByIdAndUpdate(
      id,
      {
        decision: makeDecisionDto.decision,
        comments: makeDecisionDto.comments,
        status: DecisionStatus.DECIDED,
        decidedDate: new Date(),
        decidedBy: new Types.ObjectId(userId),
        decidedByName: userName,
      },
      { new: true },
    );

    if (!decision) {
      throw new NotFoundException('Editorial decision not found');
    }

    // In production, send notification to author here

    return decision;
  }

  async addRecommendation(id: string, recommendation: string) {
    const decision = await this.decisionModel.findByIdAndUpdate(
      id,
      {
        $push: { recommendations: recommendation },
        $inc: { recommendationsCount: 1 },
      },
      { new: true },
    );

    if (!decision) {
      throw new NotFoundException('Editorial decision not found');
    }

    return decision;
  }

  async getStatistics() {
    const stats = await this.decisionModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const decisionStats = await this.decisionModel.aggregate([
      {
        $match: { decision: { $exists: true } },
      },
      {
        $group: {
          _id: '$decision',
          count: { $sum: 1 },
        },
      },
    ]);

    const avgReviewTime = await this.decisionModel.aggregate([
      {
        $match: { decidedDate: { $exists: true } },
      },
      {
        $project: {
          daysInReview: {
            $divide: [
              { $subtract: ['$decidedDate', '$submittedDate'] },
              1000 * 60 * 60 * 24,
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgDays: { $avg: '$daysInReview' },
        },
      },
    ]);

    return {
      byStatus: stats,
      byDecision: decisionStats,
      averageReviewTime: avgReviewTime[0]?.avgDays
        ? Math.round(avgReviewTime[0].avgDays)
        : 0,
    };
  }

  async delete(id: string) {
    const decision = await this.decisionModel.findByIdAndDelete(id).exec();

    if (!decision) {
      throw new NotFoundException('Editorial decision not found');
    }

    return decision;
  }
}
