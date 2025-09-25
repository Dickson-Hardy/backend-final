import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { AuthService } from '../auth.service'
import { User } from '../../users/schemas/user.schema'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    })
  }

  async validate(payload: any): Promise<User> {
    console.log('🔍 JWT Strategy validate - payload:', payload)
    console.log('🔍 JWT Strategy validate - payload.sub:', payload.sub)
    
    const user = await this.authService.validateUserById(payload.sub)
    console.log('🔍 JWT Strategy validate - user found:', user ? 'Yes' : 'No')
    console.log('🔍 JWT Strategy validate - user role:', user?.role)
    
    if (!user) {
      console.log('❌ JWT Strategy validate - User not found')
      throw new UnauthorizedException()
    }
    return user
  }
}
