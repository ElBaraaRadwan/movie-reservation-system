import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, SignupDto } from './dto';
import { JwtGuard, RolesGuard } from './guard';
import { Roles } from './decorator';
import { Role } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup/customer')
  signUpCustomer(@Body() dto: SignupDto) {
    return this.authService.signUpCustomer(dto);
  }

  @UseGuards(RolesGuard, JwtGuard)
  @Roles(Role.ADMIN)
  @Post('signup/admin')
  signUpAdmin(@Body() dto: SignupDto) {
    return this.authService.signUpAdmin(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtGuard)
  @Get('me')
  getUserInfo(@Request() req) {
    return req.user;
  }
}
