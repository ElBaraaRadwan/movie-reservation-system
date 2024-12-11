import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto';
import { UserEntity } from '../auth/entities/user.entity';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}


  // Use function findUserById as Helper function
  async findUserById(id: number): Promise<UserEntity> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return new UserEntity(user);
  }

  // Get all users
  async findAll(): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany();
    return users.map((user) => new UserEntity(user));
  }

  // Update a user by id
  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    // Ensure the user exists first
    await this.findUserById(id); // Using helper function to find user

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });

    return new UserEntity(updatedUser);
  }

  // Delete a user by id
  async remove(id: number): Promise<void> {
    // Ensure the user exists first
    await this.findUserById(id); // Using helper function to find user

    await this.prisma.user.delete({ where: { id } });
  }
}
