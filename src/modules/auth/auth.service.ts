import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from '../user/entities';
import { UserService } from 'src/modules/user/user.service';
import { Response } from 'express';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly JWT: JwtService,
    private readonly config: ConfigService,
    private readonly userService: UserService,
    private readonly REDIS: RedisService,
  ) {}

  async login(user: UserEntity, res: Response, redirect = false) {
    try {
      const accessTokenTTL = parseInt(
        this.config.getOrThrow<string>('JWT_EXPIRES_IN'),
      );

      const refreshTokenTTL = parseInt(
        this.config.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN'),
      );

      const tokenPayload: { sub: number } = {
        sub: user.id,
      };

      const accessToken = this.JWT.sign(tokenPayload, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: `${this.config.getOrThrow<string>('JWT_EXPIRES_IN')}s`,
      });

      const refreshToken = this.JWT.sign(tokenPayload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: `${this.config.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN')}s`,
      });

      // Store the refresh token in Redis with TTL
      await this.REDIS.set(
        `refresh_token:${user.id}`,
        refreshToken,
        refreshTokenTTL,
      );

      // Set cookies
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        maxAge: accessTokenTTL * 1000,
        secure: this.config.get('NODE_ENV') === 'production',
      });
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        maxAge: refreshTokenTTL * 1000,
        secure: this.config.get('NODE_ENV') === 'production',
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
      // Retrieve the refresh token from Redis
      const storedToken = await this.REDIS.get<string>(`refresh_token:${id}`);
      if (!storedToken || storedToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      return await this.userService.findOne({ id });
    } catch (err) {
      throw new UnauthorizedException('Refresh token is not valid.');
    }
  }

  async logOut(user: UserEntity, res: Response): Promise<void> {
    try {
      console.log('Clearing cookies...');
      // Delete the refresh token from Redis
      await this.REDIS.del(`refresh_token:${user.id}`);

      // Clear cookies from the response
      res.clearCookie('access_token', { path: '/' });
      res.clearCookie('refresh_token', { path: '/' });

      res.status(200).send({ message: 'Logged out successfully' });
      res.redirect('/');
    } catch (error) {
      throw new Error('Logout failed');
    }
  }
}
