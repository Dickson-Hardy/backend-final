import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Article } from '../articles/schemas/article.schema'
import { Volume } from '../volumes/schemas/volume.schema'
import { User } from '../users/schemas/user.schema'

export interface JournalStatistics {
  totalArticles: number
  totalCountries: number
  totalVolumes: number
  totalUsers: number
}

@Injectable()
export class StatisticsService {
  constructor(
    @InjectModel(Article.name) private articleModel: Model<Article>,
    @InjectModel(Volume.name) private volumeModel: Model<Volume>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async getJournalStatistics(): Promise<JournalStatistics> {
    // Get total published articles
    const totalArticles = await this.articleModel.countDocuments({
      status: 'published'
    })

    // Get total volumes
    const totalVolumes = await this.volumeModel.countDocuments()

    // Get total users
    const totalUsers = await this.userModel.countDocuments()

    // Get unique countries from authors
    const articlesWithAuthors = await this.articleModel.find({
      status: 'published'
    }).populate('authors', 'affiliation').select('authors')

    const countries = new Set<string>()
    articlesWithAuthors.forEach(article => {
      article.authors.forEach((author: any) => {
        if (author.affiliation) {
          // Extract country from affiliation (this is a simple approach)
          // You might want to implement more sophisticated country extraction
          const countryMatch = author.affiliation.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g)
          if (countryMatch) {
            // Add logic to map common country names
            const country = this.extractCountryFromAffiliation(author.affiliation)
            if (country) {
              countries.add(country)
            }
          }
        }
      })
    })

    const totalCountries = countries.size

    return {
      totalArticles,
      totalCountries,
      totalVolumes,
      totalUsers,
    }
  }

  private extractCountryFromAffiliation(affiliation: string): string | null {
    // Common country patterns in academic affiliations
    const countryPatterns = [
      { pattern: /\b(USA|United States|US)\b/i, country: 'United States' },
      { pattern: /\b(UK|United Kingdom|England|Scotland|Wales)\b/i, country: 'United Kingdom' },
      { pattern: /\b(Canada)\b/i, country: 'Canada' },
      { pattern: /\b(Australia)\b/i, country: 'Australia' },
      { pattern: /\b(Germany)\b/i, country: 'Germany' },
      { pattern: /\b(France)\b/i, country: 'France' },
      { pattern: /\b(Japan)\b/i, country: 'Japan' },
      { pattern: /\b(China)\b/i, country: 'China' },
      { pattern: /\b(India)\b/i, country: 'India' },
      { pattern: /\b(Brazil)\b/i, country: 'Brazil' },
      { pattern: /\b(Italy)\b/i, country: 'Italy' },
      { pattern: /\b(Spain)\b/i, country: 'Spain' },
      { pattern: /\b(Netherlands)\b/i, country: 'Netherlands' },
      { pattern: /\b(Sweden)\b/i, country: 'Sweden' },
      { pattern: /\b(Norway)\b/i, country: 'Norway' },
      { pattern: /\b(Denmark)\b/i, country: 'Denmark' },
      { pattern: /\b(Finland)\b/i, country: 'Finland' },
      { pattern: /\b(Switzerland)\b/i, country: 'Switzerland' },
      { pattern: /\b(Austria)\b/i, country: 'Austria' },
      { pattern: /\b(Belgium)\b/i, country: 'Belgium' },
      { pattern: /\b(South Korea)\b/i, country: 'South Korea' },
      { pattern: /\b(Singapore)\b/i, country: 'Singapore' },
      { pattern: /\b(Taiwan)\b/i, country: 'Taiwan' },
      { pattern: /\b(Israel)\b/i, country: 'Israel' },
      { pattern: /\b(South Africa)\b/i, country: 'South Africa' },
      { pattern: /\b(Mexico)\b/i, country: 'Mexico' },
      { pattern: /\b(Argentina)\b/i, country: 'Argentina' },
      { pattern: /\b(Chile)\b/i, country: 'Chile' },
      { pattern: /\b(Turkey)\b/i, country: 'Turkey' },
      { pattern: /\b(Russia)\b/i, country: 'Russia' },
      { pattern: /\b(Poland)\b/i, country: 'Poland' },
      { pattern: /\b(Czech Republic)\b/i, country: 'Czech Republic' },
      { pattern: /\b(Hungary)\b/i, country: 'Hungary' },
      { pattern: /\b(Romania)\b/i, country: 'Romania' },
      { pattern: /\b(Bulgaria)\b/i, country: 'Bulgaria' },
      { pattern: /\b(Croatia)\b/i, country: 'Croatia' },
      { pattern: /\b(Serbia)\b/i, country: 'Serbia' },
      { pattern: /\b(Greece)\b/i, country: 'Greece' },
      { pattern: /\b(Portugal)\b/i, country: 'Portugal' },
      { pattern: /\b(Ireland)\b/i, country: 'Ireland' },
      { pattern: /\b(New Zealand)\b/i, country: 'New Zealand' },
      { pattern: /\b(Thailand)\b/i, country: 'Thailand' },
      { pattern: /\b(Malaysia)\b/i, country: 'Malaysia' },
      { pattern: /\b(Indonesia)\b/i, country: 'Indonesia' },
      { pattern: /\b(Philippines)\b/i, country: 'Philippines' },
      { pattern: /\b(Vietnam)\b/i, country: 'Vietnam' },
      { pattern: /\b(Egypt)\b/i, country: 'Egypt' },
      { pattern: /\b(Nigeria)\b/i, country: 'Nigeria' },
      { pattern: /\b(Kenya)\b/i, country: 'Kenya' },
      { pattern: /\b(Morocco)\b/i, country: 'Morocco' },
      { pattern: /\b(Tunisia)\b/i, country: 'Tunisia' },
      { pattern: /\b(Algeria)\b/i, country: 'Algeria' },
      { pattern: /\b(Ethiopia)\b/i, country: 'Ethiopia' },
      { pattern: /\b(Ghana)\b/i, country: 'Ghana' },
      { pattern: /\b(Uganda)\b/i, country: 'Uganda' },
      { pattern: /\b(Tanzania)\b/i, country: 'Tanzania' },
    ]

    for (const { pattern, country } of countryPatterns) {
      if (pattern.test(affiliation)) {
        return country
      }
    }

    return null
  }
}
