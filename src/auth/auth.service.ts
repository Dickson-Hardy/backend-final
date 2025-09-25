import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { UsersService } from '../users/users.service'
import * as bcrypt from 'bcrypt'

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    console.log('🔍 Validating user:', email)
    
    const user = await this.usersService.findByEmail(email)
    console.log('👤 User found:', user ? 'Yes' : 'No')
    
    if (!user) {
      console.log('❌ User not found')
      throw new UnauthorizedException('Invalid credentials')
    }

    console.log('🔐 Comparing password...')
    const isPasswordValid = await bcrypt.compare(password, user.password)
    console.log('🔐 Password valid:', isPasswordValid)
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password')
      throw new UnauthorizedException('Invalid credentials')
    }

    console.log('✅ User validated successfully')
    return user
  }

  async validateUserById(userId: string): Promise<any> {
    console.log('🔍 AuthService validateUserById - userId:', userId, 'type:', typeof userId)
    const user = await this.usersService.findOne(userId)
    console.log('🔍 AuthService validateUserById - user found:', user ? 'Yes' : 'No')
    if (!user) {
      console.log('❌ AuthService validateUserById - User not found')
      throw new UnauthorizedException('User not found')
    }
    return user
  }

  async login(user: any) {
    const payload = { 
      email: user.email, 
      sub: user._id,
      role: user.role 
    }
    return {
      access_token: this.jwtService.sign(payload),
    }
  }
}
