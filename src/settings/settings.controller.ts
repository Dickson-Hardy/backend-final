import { Controller, Get, Put, Body, UseGuards } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger"
import { SettingsService } from "./settings.service"
import { UpdateSettingsDto } from "./dto/update-settings.dto"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../auth/guards/roles.guard"
import { Roles } from "../auth/decorators/roles.decorator"
import { UserRole } from "../users/schemas/user.schema"

@ApiTags("settings")
@Controller("settings")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all settings (admin only)" })
  @ApiResponse({ status: 200, description: "Settings retrieved successfully" })
  async getAll() {
    return this.settingsService.getAll()
  }

  @Get("public")
  @ApiOperation({ summary: "Get public settings" })
  @ApiResponse({ status: 200, description: "Public settings retrieved successfully" })
  async getPublic() {
    return this.settingsService.getPublic()
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update settings (admin only)" })
  @ApiResponse({ status: 200, description: "Settings updated successfully" })
  async update(@Body() updateSettingsDto: UpdateSettingsDto) {
    if (updateSettingsDto.settings) {
      await this.settingsService.updateMany(updateSettingsDto.settings)
    }
    return { message: "Settings updated successfully" }
  }
}
