import { PartialType } from '@nestjs/mapped-types';
import { SignupDto } from './create-auth.dto';

export class UpdateAuthDto extends PartialType(SignupDto) {}
