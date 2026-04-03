import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface OnlineUser {
  userId: number;
  userType: string;
  socketId: string;
}

interface ActiveCall {
  callerId: number;
  callerType: string;
  callerName: string;
  recipientId: number;
  recipientType: string;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private onlineUsers = new Map<string, OnlineUser>(); // key: `${userType}_${userId}`
  private activeCalls = new Map<string, ActiveCall>(); // key: sessionToken

  constructor(private readonly prisma: PrismaService) {}

  // ========================================
  // Online Status
  // ========================================
  setOnline(userId: number, userType: string, socketId: string) {
    this.onlineUsers.set(`${userType}_${userId}`, { userId, userType, socketId });
  }

  setOffline(userId: number, userType: string) {
    this.onlineUsers.delete(`${userType}_${userId}`);
  }

  isOnline(userId: number, userType: string): boolean {
    return this.onlineUsers.has(`${userType}_${userId}`);
  }

  getOnlineUsers(): { userId: number; userType: string }[] {
    return Array.from(this.onlineUsers.values()).map(({ userId, userType }) => ({
      userId,
      userType,
    }));
  }

  // ========================================
  // Room ID Generation
  // ========================================
  getRoomId(
    userId1: number, userType1: string,
    userId2: number, userType2: string,
  ): string {
    // Create consistent room ID regardless of who initiates
    const key1 = `${userType1}_${userId1}`;
    const key2 = `${userType2}_${userId2}`;
    const sorted = [key1, key2].sort();
    return `chat_${sorted[0]}_${sorted[1]}`;
  }

  // ========================================
  // Message Persistence
  // ========================================
  async saveMessage(data: {
    senderId: number;
    receiverId: number;
    senderType: string;
    content: string;
    patientId: number;
    doctorId: number;
  }) {
    return this.prisma.message.create({
      data: {
        senderId: data.senderId,
        receiverId: data.receiverId,
        senderType: data.senderType,
        content: data.content,
        patientId: data.patientId,
        doctorId: data.doctorId,
      },
    });
  }

  async markMessagesRead(messageIds: number[]) {
    return this.prisma.message.updateMany({
      where: { id: { in: messageIds } },
      data: { isRead: true, readAt: new Date() },
    });
  }

  // ========================================
  // Conversations
  // ========================================
  async getConversationsForDoctor(doctorId: number) {
    // Get unique patients this doctor has messaged
    const messages = await this.prisma.message.findMany({
      where: { doctorId },
      orderBy: { createdAt: 'desc' },
      include: {
        patient: {
          select: { id: true, fullName: true, ethioChartId: true, email: true },
        },
      },
    });

    // Group by patient
    const convMap = new Map<number, any>();
    for (const msg of messages) {
      if (msg.patientId && !convMap.has(msg.patientId)) {
        const unreadCount = await this.prisma.message.count({
          where: {
            doctorId,
            patientId: msg.patientId,
            senderType: 'patient',
            isRead: false,
          },
        });
        convMap.set(msg.patientId, {
          patient: msg.patient,
          lastMessage: msg.content,
          lastMessageAt: msg.createdAt,
          senderType: msg.senderType,
          unreadCount,
          isOnline: this.isOnline(msg.patientId, 'patient'),
        });
      }
    }

    return Array.from(convMap.values());
  }

  async getConversationsForPatient(patientId: number) {
    const messages = await this.prisma.message.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      include: {
        doctor: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const convMap = new Map<number, any>();
    for (const msg of messages) {
      if (msg.doctorId && !convMap.has(msg.doctorId)) {
        const unreadCount = await this.prisma.message.count({
          where: {
            patientId,
            doctorId: msg.doctorId,
            senderType: 'doctor',
            isRead: false,
          },
        });
        convMap.set(msg.doctorId, {
          doctor: msg.doctor,
          lastMessage: msg.content,
          lastMessageAt: msg.createdAt,
          senderType: msg.senderType,
          unreadCount,
          isOnline: this.isOnline(msg.doctorId, 'doctor'),
        });
      }
    }

    return Array.from(convMap.values());
  }

  async getThread(patientId: number, doctorId: number) {
    return this.prisma.message.findMany({
      where: { patientId, doctorId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ========================================
  // Active Calls
  // ========================================
  setActiveCall(sessionToken: string, call: ActiveCall) {
    this.activeCalls.set(sessionToken, call);
  }

  getActiveCall(sessionToken: string): ActiveCall | undefined {
    return this.activeCalls.get(sessionToken);
  }

  removeActiveCall(sessionToken: string) {
    this.activeCalls.delete(sessionToken);
  }
}
