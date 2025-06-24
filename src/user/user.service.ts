import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UpdateUserDetailsDto } from './dto/create-user.dto';

import { User } from './entities/user.entity';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { doHash, doHashValidation , hmacProcess} from "../utils/hashing";


@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}


  // createUser() {

  // }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateUserDetailsDto) {
    return `This action updates a #${id} auth`;
  }

  // auth.service.ts

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

  remove(id: number) {
    return `This action removes a #${id} auth`;
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

}


