import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UpdateUserDetailsDto } from './dto/create-user.dto';

import { User } from './entities/user.entity';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { doHash, doHashValidation , hmacProcess} from "../utils/hashing";
import { Role } from 'src/auth/enums/roles.enum';


@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}


async updateUserDetails(userId: string, verified: boolean, dto: UpdateUserDetailsDto) {
  
  const { firstName, lastName, address, oldPassword, newPassword } = dto;

  if (!verified) {
    throw new ForbiddenException('You are not a verified user');
  }

  const user = await this.getOneByQuery({_id: userId}, "password firstName email lastName address");
  if (!user) {
    throw new UnauthorizedException('User does not exist!');
  }

  if (oldPassword || newPassword) {


    if (!oldPassword || !newPassword) {
      throw new BadRequestException('Both old and new passwords must be provided');
    }

    const isMatch = await doHashValidation(oldPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Incorrect old password!');
    }

    user.password = await doHash(newPassword, 10);
  }

  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (address) user.address = address;
  
  await user.save();

  return { success: true, message: 'User details updated!' };

}

  async getOneByQuery  (filter: FilterQuery<User>,select?: string) {

    try {
      console.log(filter)
      const user = await this.userModel.findOne(filter).select(select as string)
      return user
    } catch (error) {
     throw new Error("Error getting product by seller");
  }
  
  };


  async createUser  (filter: Partial<User>,select?: string) {

    try {
      console.log(filter)

      const newUser = await this.userModel.create(filter)
      return newUser
    } catch (error) {
        console.error('Mongoose error while creating user:', error); // See real error
        throw new Error('Error creating user: ' + error.message);
  }
  
  };

  
  // ✅ Get all users (optionally filterable)
  async getAll(filter: Partial<User> = {}): Promise<User[]> {
    return this.userModel.find(filter).select('-password -verificationCode -forgotPasswordCode');
  }

  // ✅ Update user's suspension status
  async updateStatus(userId: string, isSuspended: boolean) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    user.isSuspended = isSuspended;
    await user.save();

    return { success: true, message: `User has been ${isSuspended ? 'suspended' : 'unsuspended'}` };
  }

  // ✅ Update user's role
  async updateRole(userId: string, newRole: Role) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    user.role = newRole;
    await user.save();

    return { success: true, message: `User role updated to ${newRole}` };
  }

  // ✅ Promote user to moderator (or demote)
  async promoteUser(userId: string, promoteTo: Role = Role.Moderator) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (user.role === promoteTo) {
      throw new BadRequestException(`User is already a ${promoteTo}`);
    }

    user.role = promoteTo;
    await user.save();

    return { success: true, message: `User promoted to ${promoteTo}` };
  }

  // ✅ Delete user
  async deleteUser(userId: string) {
    const result = await this.userModel.findByIdAndDelete(userId);
    if (!result) throw new NotFoundException('User not found or already deleted');

    return { success: true, message: 'User account deleted successfully' };
  }


}


