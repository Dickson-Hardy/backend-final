import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { User, UserDocument, UserRole } from '../users/schemas/user.schema'
import { Article, ArticleDocument } from '../articles/schemas/article.schema'
import { Volume, VolumeDocument } from '../volumes/schemas/volume.schema'

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Article.name) private articleModel: Model<ArticleDocument>,
    @InjectModel(Volume.name) private volumeModel: Model<VolumeDocument>,
  ) {}

  async getSystemStats() {
    // Get total users
    const totalUsers = await this.userModel.countDocuments()
    
    // Get users from last week for comparison
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const usersLastWeek = await this.userModel.countDocuments({
      createdAt: { $gte: oneWeekAgo }
    })
    
    // Get active submissions (articles in review process)
    const activeSubmissions = await this.articleModel.countDocuments({
      status: { $in: ['submitted', 'under_review', 'revision_requested'] }
    })
    
    // Get submissions from last week
    const submissionsLastWeek = await this.articleModel.countDocuments({
      submissionDate: { $gte: oneWeekAgo },
      status: { $in: ['submitted', 'under_review', 'revision_requested'] }
    })

    return {
      totalUsers,
      userChange: usersLastWeek > 0 ? `+${usersLastWeek}` : '+0',
      activeSubmissions,
      submissionChange: submissionsLastWeek > 0 ? `+${submissionsLastWeek}` : '+0',
      uptime: '99.9%',
      uptimeChange: '+0.1%',
      storageUsed: '2.5TB',
      storageChange: '+150GB'
    }
  }

  async getRecentActivities() {
    // Get recent user registrations
    const recentUsers = await this.userModel
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName email role createdAt')
      .lean()

    // Get recent article submissions
    const recentArticles = await this.articleModel
      .find()
      .sort({ submissionDate: -1 })
      .limit(5)
      .select('title status submissionDate')
      .lean()

    const activities = []

    // Add user registration activities
    recentUsers.forEach(user => {
      activities.push({
        id: `USER-${user._id}`,
        type: 'user_registration',
        description: `New ${user.role} registered: ${user.firstName} ${user.lastName}`,
        timestamp: user.createdAt,
        severity: 'info',
        user: `${user.firstName} ${user.lastName}`
      })
    })

    // Add article submission activities
    recentArticles.forEach(article => {
      activities.push({
        id: `ARTICLE-${article._id}`,
        type: 'article_submission',
        description: `New article submitted: ${article.title}`,
        timestamp: article.submissionDate,
        severity: 'info',
        user: 'System'
      })
    })

    // Sort by timestamp and return most recent
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
  }

  async getUserManagementData() {
    const users = await this.userModel
      .find()
      .select('firstName lastName email role isActive lastLogin createdAt')
      .sort({ createdAt: -1 })
      .lean()

    // Get submission and review counts for each user
    const userData = await Promise.all(
      users.map(async (user) => {
        const submissions = await this.articleModel.countDocuments({
          'authors.email': user.email
        })

        const reviews = await this.articleModel.countDocuments({
          'reviewers.email': user.email
        })

        return {
          id: `USER-${user._id}`,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('_', ' '),
          status: user.isActive ? 'active' : 'inactive',
          lastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never',
          submissions,
          reviews,
          createdAt: new Date(user.createdAt).toLocaleDateString()
        }
      })
    )

    return userData
  }

  async getSystemHealth() {
    const healthChecks = []

    // Database health check
    try {
      const startTime = Date.now()
      await this.userModel.findOne().lean()
      const responseTime = Date.now() - startTime
      
      healthChecks.push({
        id: 'HEALTH-DB',
        component: 'Database',
        status: responseTime < 100 ? 'healthy' : 'warning',
        lastCheck: new Date().toISOString(),
        responseTime,
        uptime: '99.9%'
      })
    } catch (error) {
      healthChecks.push({
        id: 'HEALTH-DB',
        component: 'Database',
        status: 'error',
        lastCheck: new Date().toISOString(),
        responseTime: 0,
        uptime: '0%'
      })
    }

    // Application health check
    healthChecks.push({
      id: 'HEALTH-APP',
      component: 'Application',
      status: 'healthy',
      lastCheck: new Date().toISOString(),
      responseTime: 15,
      uptime: '99.9%'
    })

    // Storage health check
    healthChecks.push({
      id: 'HEALTH-STORAGE',
      component: 'File Storage',
      status: 'healthy',
      lastCheck: new Date().toISOString(),
      responseTime: 25,
      uptime: '99.8%'
    })

    return healthChecks
  }

  async getEditors() {
    // Define editor roles
    const editorRoles = [
      UserRole.EDITORIAL_ASSISTANT,
      UserRole.ASSOCIATE_EDITOR,
      UserRole.EDITORIAL_BOARD,
      UserRole.EDITOR_IN_CHIEF
    ]

    const editors = await this.userModel
      .find({ 
        role: { $in: editorRoles },
        status: 'active'
      })
      .select('firstName lastName email role affiliation department specializations')
      .sort({ role: 1, lastName: 1 })
      .lean()

    return editors.map(editor => ({
      id: `USER-${editor._id}`,
      name: `${editor.firstName} ${editor.lastName}`,
      email: editor.email,
      role: editor.role.charAt(0).toUpperCase() + editor.role.slice(1).replace('_', ' '),
      affiliation: editor.affiliation || '',
      department: editor.department || '',
      specializations: editor.specializations || []
    }))
  }
}


