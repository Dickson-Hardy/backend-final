import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Article, ArticleDocument } from '../articles/schemas/article.schema';
import { Review, ReviewDocument } from '../reviews/schemas/review.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Article.name) private articleModel: Model<ArticleDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async generateReport(range: string) {
    const dateFilter = this.getDateFilter(range);

    const [
      submissionData,
      decisionData,
      reviewTimeData,
      countryData,
      keywordData,
      overview,
    ] = await Promise.all([
      this.getSubmissionTrends(dateFilter),
      this.getDecisionStats(dateFilter),
      this.getReviewTimeTrends(dateFilter),
      this.getTopCountries(dateFilter),
      this.getTopKeywords(dateFilter),
      this.getOverview(dateFilter),
    ]);

    return {
      overview,
      submissions: submissionData,
      decisions: decisionData,
      reviewTimes: reviewTimeData,
      topCountries: countryData,
      topKeywords: keywordData,
    };
  }

  private getDateFilter(range: string) {
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case '1month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case '3months':
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case '6months':
        startDate = new Date(now.setMonth(now.getMonth() - 6));
        break;
      case '12months':
        startDate = new Date(now.setMonth(now.getMonth() - 12));
        break;
      default:
        return {};
    }

    return { createdAt: { $gte: startDate } };
  }

  private async getOverview(dateFilter: any) {
    const totalSubmissions = await this.articleModel.countDocuments(dateFilter);
    
    const accepted = await this.articleModel.countDocuments({
      ...dateFilter,
      status: 'accepted',
    });

    const acceptanceRate = totalSubmissions > 0 
      ? Math.round((accepted / totalSubmissions) * 100) 
      : 0;

    const reviews = await this.reviewModel.find({
      ...dateFilter,
      status: 'completed',
    });

    const avgReviewTime = reviews.length > 0
      ? Math.round(
          reviews.reduce((sum, r: any) => {
            const days = r.submittedDate && r.acceptedDate
              ? Math.floor((r.submittedDate.getTime() - r.acceptedDate.getTime()) / (1000 * 60 * 60 * 24))
              : 0;
            return sum + days;
          }, 0) / reviews.length
        )
      : 0;

    const activeReviewers = await this.reviewModel.distinct('reviewerId', {
      ...dateFilter,
    });

    // Previous period comparison (simplified)
    const submissionsChange = 5; // Mock data
    const acceptanceRateChange = 2;
    const reviewTimeChange = -3;
    const reviewersChange = 8;

    return {
      totalSubmissions,
      submissionsChange,
      acceptanceRate,
      acceptanceRateChange,
      avgReviewTime,
      reviewTimeChange,
      activeReviewers: activeReviewers.length,
      reviewersChange,
    };
  }

  private async getSubmissionTrends(dateFilter: any) {
    const submissions = await this.articleModel.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
    ]);

    const labels = submissions.map(
      (s) => `${this.getMonthName(s._id.month)} ${s._id.year}`
    );
    const data = submissions.map((s) => s.count);

    return { labels, data };
  }

  private async getDecisionStats(dateFilter: any) {
    const decisions = await this.articleModel.aggregate([
      { $match: { ...dateFilter, status: { $ne: 'pending' } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const stats = {
      accepted: 0,
      rejected: 0,
      minorRevision: 0,
      majorRevision: 0,
    };

    decisions.forEach((d) => {
      if (d._id === 'accepted') stats.accepted = d.count;
      if (d._id === 'rejected') stats.rejected = d.count;
      if (d._id === 'minor_revision') stats.minorRevision = d.count;
      if (d._id === 'major_revision') stats.majorRevision = d.count;
    });

    return stats;
  }

  private async getReviewTimeTrends(dateFilter: any) {
    const reviews = await this.reviewModel.aggregate([
      { $match: { ...dateFilter, status: 'completed', submittedDate: { $exists: true }, acceptedDate: { $exists: true } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          avgTime: {
            $avg: {
              $divide: [
                { $subtract: ['$submittedDate', '$acceptedDate'] },
                1000 * 60 * 60 * 24, // Convert to days
              ],
            },
          },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
    ]);

    const labels = reviews.map(
      (r) => `${this.getMonthName(r._id.month)} ${r._id.year}`
    );
    const data = reviews.map((r) => Math.round(r.avgTime));

    return { labels, data };
  }

  private async getTopCountries(dateFilter: any) {
    const countries = await this.articleModel.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$country',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const total = await this.articleModel.countDocuments(dateFilter);

    return countries.map((c) => ({
      country: c._id || 'Unknown',
      count: c.count,
      percentage: Math.round((c.count / total) * 100),
    }));
  }

  private async getTopKeywords(dateFilter: any) {
    const keywords = await this.articleModel.aggregate([
      { $match: dateFilter },
      { $unwind: '$keywords' },
      {
        $group: {
          _id: '$keywords',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    return keywords.map((k) => ({
      keyword: k._id,
      count: k.count,
    }));
  }

  private getMonthName(month: number): string {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return months[month - 1] || 'Unknown';
  }
}
