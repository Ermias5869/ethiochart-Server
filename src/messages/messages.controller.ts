import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('messages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @Roles('doctor', 'patient')
  async create(@Body() dto: CreateMessageDto, @CurrentUser() user: any) {
    return this.messagesService.create(dto, user.id);
  }

  @Get(':patientId')
  @Roles('doctor', 'patient')
  async findByPatient(@Param('patientId', ParseIntPipe) patientId: number) {
    return this.messagesService.findByPatient(patientId);
  }
}
