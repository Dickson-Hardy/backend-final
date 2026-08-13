import { IsString, IsEmail, IsOptional, IsEnum, MinLength, IsArray } from 'class-validator'
import { UserRole, UserStatus } from '../schemas/user.schema'

export class CreateUserDto {
  @IsString()
  firstName: string

  @IsString()
  lastName: string

  @IsEmail()
  email: string

  @IsString()
  @MinLength(8)
  password: string

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole = UserRole.AUTHOR

  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus = UserStatus.ACTIVE

  @IsString()
  @IsOptional()
  department?: string

  @IsString()
  @IsOptional()
  affiliation?: string

  @IsString()
  @IsOptional()
  bio?: string

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  expertise?: string[]

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  specializations?: string[]

  @IsString()
  @IsOptional()
  orcidId?: string

  @IsString()
  @IsOptional()
  emailVerificationToken?: string

  @IsOptional()
  emailVerified?: boolean
}
