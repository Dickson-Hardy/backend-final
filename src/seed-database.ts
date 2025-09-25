import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { UsersService } from './users/users.service'
import { VolumesService } from './volumes/volumes.service'
import { ArticlesService } from './articles/articles.service'
import { NewsService } from './news/news.service'
import { UserRole, UserDocument } from './users/schemas/user.schema'
import { VolumeStatus } from './volumes/schemas/volume.schema'
import { NewsCategory } from './news/dto/create-news.dto'
import * as bcrypt from 'bcrypt'

async function seedDatabase() {
  const app = await NestFactory.createApplicationContext(AppModule)
  const usersService = app.get(UsersService)
  const volumesService = app.get(VolumesService)
  const articlesService = app.get(ArticlesService)
  const newsService = app.get(NewsService)

  try {
    console.log('🌱 Starting database seeding...')

    // 1. Create Admin User
    const existingAdmin = await usersService.findByEmail('admin@amhsj.org')
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('Admin@2025!', 12)
      const adminUser = {
        firstName: 'System',
        lastName: 'Administrator',
        email: 'admin@amhsj.org',
        password: hashedPassword,
        role: UserRole.ADMIN,
        affiliation: 'AMHSJ Editorial Board',
        bio: 'System administrator for AMHSJ journal management system',
        emailVerified: true,
        specializations: ['Journal Management', 'System Administration', 'Editorial Oversight']
      }
      await usersService.create(adminUser)
      console.log('✅ Admin user created')
    } else {
      console.log('ℹ️ Admin user already exists')
    }

    // 2. Create Editor-in-Chief
    const existingEIC = await usersService.findByEmail('editor@amhsj.org')
    if (!existingEIC) {
      const hashedPassword = await bcrypt.hash('Editor@2025!', 12)
      const eicUser = {
        firstName: 'Dr. Sarah',
        lastName: 'Johnson',
        email: 'editor@amhsj.org',
        password: hashedPassword,
        role: UserRole.EDITOR_IN_CHIEF,
        affiliation: 'Harvard Medical School',
        bio: 'Editor-in-Chief of AMHSJ with expertise in clinical research and medical education',
        emailVerified: true,
        specializations: ['Clinical Research', 'Medical Education', 'Public Health']
      }
      await usersService.create(eicUser)
      console.log('✅ Editor-in-Chief created')
    } else {
      console.log('ℹ️ Editor-in-Chief already exists')
    }

    // 3. Create Sample Authors
    const sampleAuthors = [
      {
        firstName: 'Dr. Michael',
        lastName: 'Chen',
        email: 'mchen@university.edu',
        password: await bcrypt.hash('Author@2025!', 12),
        role: UserRole.AUTHOR,
        affiliation: 'Stanford University School of Medicine',
        bio: 'Cardiologist and researcher specializing in heart disease prevention',
        emailVerified: true,
        specializations: ['Cardiology', 'Preventive Medicine', 'Clinical Trials']
      },
      {
        firstName: 'Dr. Emily',
        lastName: 'Rodriguez',
        email: 'erodriguez@hospital.org',
        password: await bcrypt.hash('Author@2025!', 12),
        role: UserRole.AUTHOR,
        affiliation: 'Mayo Clinic',
        bio: 'Oncologist focused on personalized cancer treatment approaches',
        emailVerified: true,
        specializations: ['Oncology', 'Personalized Medicine', 'Cancer Research']
      }
    ]

    for (const authorData of sampleAuthors) {
      const existingAuthor = await usersService.findByEmail(authorData.email)
      if (!existingAuthor) {
        await usersService.create(authorData)
        console.log(`✅ Author ${authorData.firstName} ${authorData.lastName} created`)
      } else {
        console.log(`ℹ️ Author ${authorData.firstName} ${authorData.lastName} already exists`)
      }
    }

    // 4. Create Sample Volumes
    const currentYear = new Date().getFullYear()
    const sampleVolumes = [
      {
        volume: currentYear - 1,
        issue: 1,
        year: currentYear - 1,
        title: `Volume ${currentYear - 1}: Advances in Medical Research`,
        description: 'A comprehensive collection of peer-reviewed medical research articles from leading institutions worldwide.',
        publishedDate: new Date(currentYear - 1, 11, 31).toISOString(),
        status: VolumeStatus.PUBLISHED,
        totalArticles: 25,
        totalPages: 300
      },
      {
        volume: currentYear,
        issue: 1,
        year: currentYear,
        title: `Volume ${currentYear}: Innovation in Healthcare`,
        description: 'Cutting-edge research in medical technology, treatment protocols, and healthcare delivery systems.',
        publishedDate: new Date(currentYear, 5, 30).toISOString(),
        status: VolumeStatus.PUBLISHED,
        totalArticles: 18,
        totalPages: 250
      }
    ]

    for (const volumeData of sampleVolumes) {
      const existingVolumes = await volumesService.findAll()
      const volumeExists = existingVolumes.some(v => v.volume === volumeData.volume && v.issue === volumeData.issue)
      if (!volumeExists) {
        await volumesService.create(volumeData)
        console.log(`✅ Volume ${volumeData.volume}.${volumeData.issue} created`)
      } else {
        console.log(`ℹ️ Volume ${volumeData.volume}.${volumeData.issue} already exists`)
      }
    }

    // 5. Create Sample News Items
    const adminUser = await usersService.findByEmail('admin@amhsj.org') as UserDocument
    if (adminUser) {
      const sampleNews = [
        {
          title: 'AMHSJ Now Indexed in Major Medical Databases',
          content: 'We are pleased to announce that AMHSJ has been accepted for indexing in PubMed, MEDLINE, and other major medical databases. This recognition validates our commitment to publishing high-quality peer-reviewed research.',
          category: NewsCategory.ANNOUNCEMENT,
          published: true,
          featured: true
        },
        {
          title: 'Call for Papers: Special Issue on AI in Medicine',
          content: 'AMHSJ is accepting submissions for a special issue focusing on artificial intelligence applications in medical diagnosis, treatment, and healthcare delivery. Submission deadline: March 31, 2025.',
          category: NewsCategory.ANNOUNCEMENT,
          published: true,
          featured: false
        }
      ]

      for (const newsData of sampleNews) {
        await newsService.create(newsData, adminUser.id)
        console.log(`✅ News item "${newsData.title}" created`)
      }
    }

    console.log('🎉 Database seeding completed successfully!')
    console.log('\n📋 Created Accounts:')
    console.log('👤 Admin: admin@amhsj.org / Admin@2025!')
    console.log('👤 Editor-in-Chief: editor@amhsj.org / Editor@2025!')
    console.log('👤 Authors: mchen@university.edu / Author@2025!')
    console.log('👤 Authors: erodriguez@hospital.org / Author@2025!')

  } catch (error) {
    console.error('❌ Error during seeding:', error.message)
  } finally {
    await app.close()
  }
}

// Run the seed function
seedDatabase()
  .then(() => {
    console.log('✅ Seeding process completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Seeding process failed:', error)
    process.exit(1)
  })
