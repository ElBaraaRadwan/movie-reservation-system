import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { CreateReservationDto, UpdateReservationDto } from './dto';
import { Role } from '@prisma/client';
import { UserEntity } from 'src/modules/user/entities';
import { JwtGuard, RolesGuard } from '../auth/guard';
import { GetUser, Roles } from '../auth/decorator';

@UseGuards(JwtGuard)
@Controller('reservation')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post(':title')
  create(
    @Param('title') movieTitle: string,
    @Body() createDto: CreateReservationDto,
    @GetUser() user: UserEntity,
  ) {
    return this.reservationService.create(
      { ...createDto, movieTitle },
      user.id,
    );
  }

  @Get()
  findMyReservation(@GetUser() user: UserEntity) {
    return this.reservationService.findMyReservation(user.id);
  }

  @Get('/all')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  findAll() {
    return this.reservationService.findAll();
  }

  @Patch(':title')
  update(
    @Param('title') movieTitle: string,
    @Body() updateDto: UpdateReservationDto,
    @GetUser() user: UserEntity,
  ) {
    return this.reservationService.update(movieTitle, updateDto, user.id);
  }

  @Delete(':title')
  remove(@Param('title') movieTitle: string, @GetUser() user: UserEntity) {
    return this.reservationService.remove(movieTitle, user.id);
  }
}