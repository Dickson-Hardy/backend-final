import { Injectable } from "@nestjs/common"
import { InjectModel } from "@nestjs/mongoose"
import { Model } from "mongoose"
import { Setting, SettingDocument } from "./schemas/setting.schema"

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(Setting.name) private settingModel: Model<SettingDocument>
  ) {}

  async getAll(): Promise<Record<string, any>> {
    const settings = await this.settingModel.find().exec()
    
    // Convert array of settings to object
    const settingsObject: Record<string, any> = {}
    settings.forEach(setting => {
      settingsObject[setting.key] = setting.value
    })

    // Return default settings if none exist
    if (Object.keys(settingsObject).length === 0) {
      return this.getDefaultSettings()
    }

    return settingsObject
  }

  async getPublic(): Promise<Record<string, any>> {
    const settings = await this.settingModel.find({ isPublic: true }).exec()
    
    const settingsObject: Record<string, any> = {}
    settings.forEach(setting => {
      settingsObject[setting.key] = setting.value
    })

    return settingsObject
  }

  async get(key: string): Promise<any> {
    const setting = await this.settingModel.findOne({ key }).exec()
    return setting ? setting.value : null
  }

  async set(key: string, value: any, category?: string, description?: string, isPublic = false): Promise<Setting> {
    const setting = await this.settingModel.findOneAndUpdate(
      { key },
      { 
        value, 
        category, 
        description,
        isPublic 
      },
      { upsert: true, new: true }
    ).exec()

    return setting
  }

  async updateMany(settings: Record<string, any>): Promise<void> {
    const promises = Object.entries(settings).map(([key, value]) => 
      this.set(key, value)
    )

    await Promise.all(promises)
  }

  async delete(key: string): Promise<void> {
    await this.settingModel.findOneAndDelete({ key }).exec()
  }

  private getDefaultSettings(): Record<string, any> {
    return {
      // General Settings
      siteName: "AMHSJ - Advanced Medical Health Sciences Journal",
      siteDescription: "A leading medical journal publishing cutting-edge research in health sciences",
      siteUrl: process.env.FRONTEND_URL || "http://localhost:3000",
      adminEmail: process.env.ADMIN_EMAIL || "admin@amhsj.org",
      supportEmail: process.env.SUPPORT_EMAIL || "support@amhsj.org",
      
      // Publication Settings
      maxFileSize: "10",
      allowedFileTypes: "pdf,doc,docx,txt",
      reviewDeadlineDays: "30",
      maxReviewersPerArticle: "3",
      autoAssignReviewers: false,
      
      // Email Settings
      smtpHost: process.env.SMTP_HOST || "",
      smtpPort: process.env.SMTP_PORT || "587",
      smtpUsername: process.env.SMTP_USERNAME || "",
      smtpPassword: "********",
      emailFromName: "AMHSJ Editorial Team",
      
      // Security Settings
      sessionTimeout: "24",
      maxLoginAttempts: "5",
      passwordMinLength: "8",
      requireEmailVerification: true,
      twoFactorAuth: false,
      
      // Notification Settings
      emailNotifications: true,
      reviewReminders: true,
      submissionNotifications: true,
      deadlineReminders: true,
      reminderFrequency: "weekly"
    }
  }
}
