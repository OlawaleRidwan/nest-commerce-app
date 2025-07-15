import {
  Controller, Get, Patch, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { PromoteUserDto } from './dto/promote-user.dto';
import { SuspendUserDto } from './dto/suspend-user.dto';
import { DeleteUserDto } from './dto/delete-user.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/roles.enum';
import { AuthGuard } from '@nestjs/passport';

@Controller('admin')

@UseGuards(AuthGuard('jwt'),RolesGuard)
@Roles(Role.Admin)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // @UseGuards(AuthGuard('jwt'))
  @Get('users')
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Patch('suspend')
  suspendUser(@Body() dto: SuspendUserDto) {
    return this.adminService.suspendUser(dto);
  }

  @Patch('promote')
  promoteUser(@Body() dto: PromoteUserDto) {
    return this.adminService.promoteUser(dto);
  }

  @Delete('delete')
  deleteUser(@Body() dto: DeleteUserDto) {
    return this.adminService.deleteUser(dto);
  }
}
