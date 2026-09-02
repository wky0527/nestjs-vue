import { Controller, Post, Body, UseGuards, Get, Req, Param, Put, Delete, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PermissionService } from './permission.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private permissionService: PermissionService,
  ) {}

  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
    return await this.authService.login(body.username, body.password);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req) {
    return req.user;
  }

  @Get('menus')
  @UseGuards(JwtAuthGuard)
  async getUserMenus(@Req() req) {
    return await this.permissionService.getUserMenus(req.user.userId);
  }

  @Get('buttons')
  @UseGuards(JwtAuthGuard)
  async getUserButtons(@Req() req) {
    return await this.permissionService.getUserButtons(req.user.userId);
  }

  @Get('buttons/:menuId')
  @UseGuards(JwtAuthGuard)
  async getButtonsByMenu(@Req() req, @Param('menuId') menuId: number) {
    const userId = req.user.userId;
    const userMenus = await this.permissionService.getUserMenus(userId);
    const hasMenuAccess = this.hasMenuAccess(userMenus, menuId);
    if (!hasMenuAccess) throw new Error('没有访问该菜单的权限');
    return await this.permissionService.getUserButtons(userId, menuId);
  }

  @Get('all-menus')
  @UseGuards(JwtAuthGuard)
  async getAllMenus() {
    return await this.permissionService.getAllMenus();
  }

  private hasMenuAccess(menus: any[], menuId: number): boolean {
    for (const menu of menus) {
      if (menu.id === menuId) return true;
      if (menu.children?.length > 0 && this.hasMenuAccess(menu.children, menuId)) return true;
    }
    return false;
  }

  // Role CRUD
  @Get('role/list')
  async getRoles() {
    return this.authService.findAllRoles();
  }

  @Post('role')
  async createRole(@Body() body: any) {
    return this.authService.createRole(body);
  }

  @Put('role/:id')
  async updateRole(@Param('id') id: number, @Body() body: any) {
    return this.authService.updateRole(id, body);
  }

  @Delete('role/:id')
  async deleteRole(@Param('id') id: number) {
    return this.authService.deleteRole(id);
  }

  @Put('role/:id/permissions')
  async assignPermissions(@Param('id') id: number, @Body() body: { menuIds: number[] }) {
    return this.permissionService.assignMenuToRole(id, body.menuIds);
  }

  @Get('role/:id/permissions')
  async getRolePermissions(@Param('id') id: number) {
    return this.permissionService.getRolePermissions(id);
  }

  // Admin management
  @Get('admin/list')
  async getAdmins(@Query() query: any) {
    return this.authService.findAllAdmins(query);
  }

  @Post('admin')
  async createAdmin(@Body() body: any) {
    return this.authService.createAdmin(body);
  }

  @Put('admin/:id')
  async updateAdmin(@Param('id') id: number, @Body() body: any) {
    return this.authService.updateAdmin(id, body);
  }

  @Delete('admin/:id')
  async deleteAdmin(@Param('id') id: number) {
    return this.authService.deleteAdmin(id);
  }

  @Put('admin/:id/reset-password')
  async resetAdminPassword(@Param('id') id: number, @Body() body: { password: string }) {
    return this.authService.resetAdminPassword(id, body.password);
  }
}
