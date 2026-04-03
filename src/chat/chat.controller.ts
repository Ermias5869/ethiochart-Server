import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations/doctor/:doctorId')
  async getDoctorConversations(@Param('doctorId', ParseIntPipe) doctorId: number) {
    return this.chatService.getConversationsForDoctor(doctorId);
  }

  @Get('conversations/patient/:patientId')
  async getPatientConversations(@Param('patientId', ParseIntPipe) patientId: number) {
    return this.chatService.getConversationsForPatient(patientId);
  }

  @Get('thread/:patientId/:doctorId')
  async getThread(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Param('doctorId', ParseIntPipe) doctorId: number,
  ) {
    return this.chatService.getThread(patientId, doctorId);
  }

  @Get('online')
  getOnlineUsers() {
    return this.chatService.getOnlineUsers();
  }
}
