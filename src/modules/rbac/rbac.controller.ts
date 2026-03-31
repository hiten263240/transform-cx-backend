import { Body, Controller, Delete, Get, Post, Put, Query } from '@nestjs/common';
import { RbacService } from './rbac.service';

@Controller()
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Post('role')
  createRole(@Body() body: Record<string, unknown>) {
    return this.rbacService.createRole(body);
  }

  @Put('role')
  updateRole(@Body() body: Record<string, unknown>) {
    return this.rbacService.updateRole(body);
  }

  @Delete('role')
  deleteRole(@Query('roleId') roleId?: string) {
    return this.rbacService.deleteRole(roleId);
  }

  @Get('get-roles')
  getRoles() {
    return this.rbacService.getRoles();
  }

  @Post('page')
  createPage(@Body() body: Record<string, unknown>) {
    return this.rbacService.createPage(body);
  }

  @Put('page')
  updatePage(@Body() body: Record<string, unknown>) {
    return this.rbacService.updatePage(body);
  }

  @Get('get-pages')
  getPages() {
    return this.rbacService.getPages();
  }

  @Get('users')
  getUsers() {
    return this.rbacService.getUsers();
  }

  @Put('users')
  updateUserRole(@Body() body: Record<string, unknown>) {
    return this.rbacService.updateUserRole(body);
  }

  @Get('user-permissions')
  getUserPermissions(@Query('email') email?: string) {
    return this.rbacService.getUserPermissions(email);
  }
}
