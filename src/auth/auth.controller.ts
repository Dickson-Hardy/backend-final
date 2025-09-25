import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common'
import { AuthService } from './auth.service'
import { UsersService } from '../users/users.service'
import { CreateUserDto } from '../users/dto/create-user.dto'
import { LoginDto } from './dto/login.dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { EmailService } from '../email/email.service'
import { UserDocument } from '../users/schemas/user.schema'
import * as crypto from 'crypto'

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private emailService: EmailService
  ) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex')
    
    // Create user with verification token
    const user = await this.usersService.create({
      ...createUserDto,
      emailVerificationToken,
      emailVerified: false
    } as CreateUserDto)

    // Send verification email
    await this.emailService.sendVerificationEmail(
      user.email,
      user.firstName,
      emailVerificationToken
    )

    return {
      message: 'Registration successful. Please check your email for verification instructions.',
      user: {
        id: (user as UserDocument).id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    }
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    // Add validation and error handling
    if (!loginDto || !loginDto.email || !loginDto.password) {
      throw new Error('Email and password are required')
    }

    const user = await this.authService.validateUser(loginDto.email, loginDto.password)
    const { access_token } = await this.authService.login(user)
    return {
      access_token,
      user: {
        id: (user as UserDocument).id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    const user = await this.usersService.findOne(req.user.id)
    return {
      id: (user as UserDocument).id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      affiliation: user.affiliation,
      bio: user.bio,
      profileImage: user.profileImage,
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile')
  async updateProfile(@Request() req, @Body() updateData: any) {
    const user = await this.usersService.update(req.user.id, updateData, req.user.id)
    return {
      id: (user as UserDocument).id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      affiliation: user.affiliation,
      bio: user.bio,
      profileImage: user.profileImage,
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  async refresh(@Request() req) {
    const { access_token } = await this.authService.login(req.user)
    return { access_token }
  }
}
