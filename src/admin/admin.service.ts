import { Injectable, NotFoundException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { PromoteUserDto } from './dto/promote-user.dto';
import { SuspendUserDto } from './dto/suspend-user.dto';
import { DeleteUserDto } from './dto/delete-user.dto';

@Injectable()
export class AdminService {
  constructor(private readonly userService: UserService) {}

  async getAllUsers() {
    return this.userService.getAll(); // assumes this method exists
  }

  async suspendUser(dto: SuspendUserDto) {
    return this.userService.updateStatus(dto.userId, dto.suspended);
  }

  async promoteUser(dto: PromoteUserDto) {
    return this.userService.updateRole(dto.userId, dto.newRole);
  }

  async deleteUser(dto: DeleteUserDto) {
    return this.userService.deleteUser(dto.userId);
  }
}
