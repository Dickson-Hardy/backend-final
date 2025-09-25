import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { UsersService } from './users/users.service'
import * as bcrypt from 'bcrypt'

async function rehashAdminPassword() {
  const app = await NestFactory.createApplicationContext(AppModule)
  const usersService = app.get(UsersService)

  try {
    console.log('🔄 Rehashing admin password...')
    
    // Find the admin user
    const adminUser = await usersService.findByEmail('admin@amhsj.org')
    if (!adminUser) {
      console.log('❌ Admin user not found')
      await app.close()
      return
    }

    console.log('👤 Admin user found:', adminUser.email)
    
    // Hash the password with the same configuration
    const newPassword = 'Admin@2025!'
    const hashedPassword = await bcrypt.hash(newPassword, 12)
    
    console.log('🔐 New hashed password:', hashedPassword)
    
    // Update the user's password using the userModel directly
    const userModel = (usersService as any).userModel
    await userModel.updateOne(
      { email: 'admin@amhsj.org' },
      { password: hashedPassword }
    )
    
    console.log('✅ Admin password updated successfully!')
    console.log('📧 Email: admin@amhsj.org')
    console.log('🔑 Password: Admin@2025!')
    
    // Test the password comparison
    console.log('🧪 Testing password comparison...')
    const testResult = await bcrypt.compare(newPassword, hashedPassword)
    console.log('🧪 Password comparison test:', testResult ? '✅ PASS' : '❌ FAIL')

  } catch (error) {
    console.error('❌ Error updating admin password:', error.message)
  } finally {
    await app.close()
  }
}

// Run the rehash function
rehashAdminPassword()
  .then(() => {
    console.log('✅ Password rehashing completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
