import { Controller, Post, Get, Put, Delete, Body, UseGuards, Req, Query, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RoleEnum } from '../auth/role.enum';
import { RolesGuard } from '../auth/roles.guard';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('create')
  create(@Body() body: any) {
    return this.userService.create(body);
  }

  @Get('list')
  async list(@Query() query: any) {
    return this.userService.findAll(query);
  }

  @Get('stats')
  async getStats() {
    return this.userService.getStats();
  }

  @Put('batch-update')
  async batchUpdate(@Body() body: { ids: number[]; data: any }) {
    return this.userService.batchUpdate(body.ids, body.data);
  }

  // Member Levels
  @Get('levels')
  async getLevels() {
    return this.userService.findAllLevels();
  }

  @Post('levels')
  async createLevel(@Body() body: any) {
    return this.userService.createLevel(body);
  }

  @Put('levels/:id')
  async updateLevel2(@Param('id') id: number, @Body() body: any) {
    return this.userService.updateMemberLevel(id, body);
  }

  @Delete('levels/:id')
  async deleteLevel(@Param('id') id: number) {
    return this.userService.deleteLevel(id);
  }

  // Blacklist
  @Get('blacklist')
  async getBlacklist(@Query() query: any) {
    return this.userService.findBlacklist(query);
  }

  @Post('blacklist')
  async addToBlacklist(@Body() body: any) {
    return this.userService.addToBlacklist(body);
  }

  @Put('blacklist/:id/unblock')
  async unblock(@Param('id') id: number) {
    return this.userService.unblockFromBlacklist(id);
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return this.userService.findOne({ where: { id }, relations: ['roleRef'] });
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() body: any) {
    return this.userService.update(id, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: number) {
    return this.userService.delete(id);
  }

  @Put(':id/level')
  async updateLevel(@Param('id') id: number, @Body() body: { level: string }) {
    return this.userService.updateLevel(id, body.level);
  }

  @Put(':id/blacklist')
  async toggleBlacklist(@Param('id') id: number, @Body() body: { isBlacklisted: boolean; reason?: string }) {
    return this.userService.toggleBlacklist(id, body.isBlacklisted, body.reason);
  }

  @Put(':id/reset-password')
  async resetPassword(@Param('id') id: number, @Body() body: { password: string }) {
    return this.userService.resetPassword(id, body.password);
  }

  @Put(':id/role')
  async updateRole(@Param('id') id: number, @Body() body: { roleId: number }) {
    return this.userService.updateRole(id, body.roleId);
  }

  @Get(':id/login-logs')
  async getLoginLogs(@Param('id') id: number) {
    return this.userService.getLoginLogs(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.Admin)
  @Get('profile')
  getProfile(@Req() req) {
    return req.user;
  }
}
