import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { AdminService } from './admin.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { UserRole } from '../users/schemas/user.schema'

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get system statistics' })
  @ApiResponse({ 
    status: 200, 
    description: 'System statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalUsers: { type: 'number', example: 1250 },
        userChange: { type: 'string', example: '+12' },
        activeSubmissions: { type: 'number', example: 45 },
        submissionChange: { type: 'string', example: '+5' },
        uptime: { type: 'string', example: '99.9%' },
        uptimeChange: { type: 'string', example: '+0.1%' },
        storageUsed: { type: 'string', example: '2.5TB' },
        storageChange: { type: 'string', example: '+150GB' }
      }
    }
  })
  async getStats() {
    return this.adminService.getSystemStats()
  }

  @Get('activities')
  @ApiOperation({ summary: 'Get recent system activities' })
  @ApiResponse({ 
    status: 200, 
    description: 'Recent activities retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'ACT-001' },
          type: { type: 'string', example: 'user_registration' },
          description: { type: 'string', example: 'New user registered' },
          timestamp: { type: 'string', example: '2024-01-20T14:30:00Z' },
          severity: { type: 'string', example: 'info' },
          user: { type: 'string', example: 'Dr. Sarah Johnson' }
        }
      }
    }
  })
  async getActivities() {
    return this.adminService.getRecentActivities()
  }

  @Get('users')
  @ApiOperation({ summary: 'Get user management data' })
  @ApiResponse({ 
    status: 200, 
    description: 'User management data retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'USER-001' },
          name: { type: 'string', example: 'Dr. Sarah Johnson' },
          email: { type: 'string', example: 'sarah.johnson@university.edu' },
          role: { type: 'string', example: 'Author' },
          status: { type: 'string', example: 'active' },
          lastLogin: { type: 'string', example: '2024-01-20 14:30' },
          submissions: { type: 'number', example: 3 },
          reviews: { type: 'number', example: 0 },
          createdAt: { type: 'string', example: '2024-01-15' }
        }
      }
    }
  })
  async getUsers() {
    return this.adminService.getUserManagementData()
  }

  @Get('health')
  @ApiOperation({ summary: 'Get system health status' })
  @ApiResponse({ 
    status: 200, 
    description: 'System health status retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'HEALTH-001' },
          component: { type: 'string', example: 'Database' },
          status: { type: 'string', example: 'healthy' },
          lastCheck: { type: 'string', example: '2024-01-20T14:30:00Z' },
          responseTime: { type: 'number', example: 45 },
          uptime: { type: 'string', example: '99.9%' }
        }
      }
    }
  })
  async getHealth() {
    return this.adminService.getSystemHealth()
  }

  @Get('editors')
  @ApiOperation({ summary: 'Get all editors' })
  @ApiResponse({ 
    status: 200, 
    description: 'Editors retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'USER-001' },
          name: { type: 'string', example: 'Dr. Sarah Johnson' },
          email: { type: 'string', example: 'sarah.johnson@university.edu' },
          role: { type: 'string', example: 'Editor in Chief' },
          affiliation: { type: 'string', example: 'University Medical Center' },
          department: { type: 'string', example: 'Cardiology' },
          specializations: { type: 'array', items: { type: 'string' }, example: ['Cardiology', 'Research'] }
        }
      }
    }
  })
  async getEditors() {
    return this.adminService.getEditors()
  }
}


