import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { UsersService } from './users/users.service'
import { UserRole } from './users/schemas/user.schema'
import * as bcrypt from 'bcrypt'

async function seedAdminUser() {
  const app = await NestFactory.createApplicationContext(AppModule)
  const usersService = app.get(UsersService)

  try {
    // Check if admin already exists
    const existingAdmin = await usersService.findByEmail('admin@amhsj.org')
    if (existingAdmin) {
      console.log('✅ Admin user already exists')
      await app.close()
      return
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('Admin@2025!', 12)

    // Create admin user
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

    const createdAdmin = await usersService.create(adminUser)
    
    console.log('🎉 Admin user created successfully!')
    console.log('📧 Email: admin@amhsj.org')
    console.log('🔑 Password: Admin@2025!')
    console.log('👤 Role: ADMIN')
    console.log('🆔 User ID:', createdAdmin._id.toString())

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message)
  } finally {
    await app.close()
  }
}

// Run the seed function
seedAdminUser()
  .then(() => {
    console.log('✅ Seeding completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  })
