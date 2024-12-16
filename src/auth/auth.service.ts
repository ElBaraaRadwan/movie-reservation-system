import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from '../user/entities';
import { UserService } from 'src/user/user.service';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly JWT: JwtService,
    private readonly config: ConfigService,
    private readonly userService: UserService,
  ) {}

  async login(user: UserEntity, res: Response, redirect = false) {
    try {
      const expiresAccessToken = new Date();
      expiresAccessToken.setSeconds(
        expiresAccessToken.getTime() +
          parseInt(this.config.getOrThrow<string>('JWT_EXPIRES_IN')),
      ); // Set the expiration time for the access token in seconds

      const expiresRefreshToken = new Date();
      expiresRefreshToken.setSeconds(
        expiresRefreshToken.getTime() +
          parseInt(this.config.getOrThrow<string>('JWT_EXPIRES_IN')),
      ); // Set the expiration time for the refresh token in seconds

      const tokenPayload: { sub: number } = {
        sub: user.id,
      };

      const accessToken = this.JWT.sign(tokenPayload, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: `${this.config.getOrThrow<string>('JWT_EXPIRES_IN')}s`,
      });

      const refreshToken = this.JWT.sign(tokenPayload, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: `${this.config.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN')}s`,
      });

      await this.userService.update(user.email, {
        refreshToken: await bcrypt.hash(refreshToken, 10),
      });

      res.cookie('access_token', accessToken, {
        expires: expiresAccessToken,
        httpOnly: true,
        secure: this.config.get('NODE_ENV') === 'production',
      });
      res.cookie('Refresh', refreshToken, {
        httpOnly: true,
        secure: this.config.get('NODE_ENV') === 'production',
        expires: expiresRefreshToken,
      });

      if (redirect) {
        res.redirect('/');
      }
    } catch (error) {
      throw new Error();
    }
  }

  async verifyUser(email: string, password: string): Promise<UserEntity> {
    try {
      const user = await this.userService.findOne({ email });

      // Compare the provided password with the hashed password
      // stored in the database, if they do not match, throw an error
      if (!(await bcrypt.compare(password, user.password)))
        throw new UnauthorizedException();

      return new UserEntity(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async verifyUserRefreshToken(refreshToken: string, id: number) {
    try {
      const user = await this.userService.findOne({ id });
      if (!(await bcrypt.compare(refreshToken, user.refreshToken))) {
        throw new UnauthorizedException();
      }
      return user;
    } catch (err) {
      throw new UnauthorizedException('Refresh token is not valid.');
    }
  }

  async logOut(user: UserEntity): Promise<void> {
    await this.userService.update(user.email, { refreshToken: null });
  }
}
