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
    const user = await this.usersService.findByEmail(email)
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials')
    }

    return user
  }

  async validateUserById(userId: string): Promise<any> {
    const user = await this.usersService.findOne(userId)
    if (!user) {
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
