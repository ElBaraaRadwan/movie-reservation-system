import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email cannot be empty' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password cannot be empty' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @IsString()
  @IsOptional()
  role?: Role; // Optional, defaults to 'CUSTOMER' in the database

  @IsString()
  @IsNotEmpty({ message: 'Username cannot be empty' })
  username: string;

  @IsString()
  @IsOptional()
  refreshToken?: string;
}
