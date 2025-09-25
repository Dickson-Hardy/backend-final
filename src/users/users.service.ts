import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { User, UserDocument, UserRole } from './schemas/user.schema'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { UploadService } from '../upload/upload.service'
import * as bcrypt from 'bcrypt'
import { Express } from 'express'

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private uploadService: UploadService
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const existingUser = await this.userModel.findOne({ email: createUserDto.email })
    if (existingUser) {
      throw new ConflictException('User with this email already exists')
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10)
    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    })

    return user.save()
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    filters: { role?: string; search?: string } = {}
  ) {
    const skip = (page - 1) * limit
    const query: any = {}

    if (filters.role) {
      query.role = filters.role
    }
    if (filters.search) {
      query.$or = [
        { firstName: { $regex: filters.search, $options: 'i' } },
        { lastName: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
        { affiliation: { $regex: filters.search, $options: 'i' } },
      ]
    }

    const [users, total] = await Promise.all([
      this.userModel
        .find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(query),
    ])

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }

  async findReviewers(): Promise<User[]> {
    return this.userModel
      .find({ role: UserRole.REVIEWER })
      .select('firstName lastName email affiliation expertise')
      .exec()
  }

  async findOne(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).select('-password').exec()
    if (!user) {
      throw new NotFoundException('User not found')
    }
    return user
  }

  async findByEmail(email: string): Promise<User> {
    return this.userModel.findOne({ email }).exec()
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    requesterId: string,
    profileImage?: Express.Multer.File
  ): Promise<User> {
    const user = await this.userModel.findById(id)
    if (!user) {
      throw new NotFoundException('User not found')
    }

    // Check if user can update this profile
    if (user._id.toString() !== requesterId) {
      // Add role-based permission check here if needed
    }

    let imageUpload = user.profileImage
    if (profileImage) {
      // Delete old image if exists
      if (user.profileImage?.publicId) {
        await this.uploadService.deleteFile(user.profileImage.publicId)
      }
      imageUpload = await this.uploadService.uploadProfile(profileImage)
    }

    const updateData = { ...updateUserDto }
    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 10)
    }
    if (imageUpload) {
      updateData.profileImage = imageUpload
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .select('-password')
      .exec()

    return updatedUser
  }

  async remove(id: string): Promise<void> {
    const user = await this.userModel.findById(id)
    if (!user) {
      throw new NotFoundException('User not found')
    }

    // Delete profile image if exists
    if (user.profileImage?.publicId) {
      await this.uploadService.deleteFile(user.profileImage.publicId)
    }

    await this.userModel.findByIdAndDelete(id)
  }
}
