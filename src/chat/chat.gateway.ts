import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly chatService: ChatService) {}

  // ========================================
  // Connection Management
  // ========================================
  handleConnection(client: Socket) {
    const userId = client.handshake.auth?.userId;
    const userType = client.handshake.auth?.userType; // 'doctor' | 'patient'
    const userName = client.handshake.auth?.userName || 'Unknown';

    if (!userId || !userType) {
      this.logger.warn(`Client ${client.id} connected without auth — disconnecting`);
      client.disconnect();
      return;
    }

    // Store user info on socket
    client.data = { userId: Number(userId), userType, userName };

    // Track online status
    this.chatService.setOnline(Number(userId), userType, client.id);

    // Join personal room for direct messages
    client.join(`user_${userId}_${userType}`);

    // Broadcast online status
    this.server.emit('userOnline', {
      userId: Number(userId),
      userType,
      userName,
    });

    this.logger.log(`✅ ${userType} ${userName} (ID: ${userId}) connected — socket: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const { userId, userType, userName } = client.data || {};
    if (userId) {
      this.chatService.setOffline(Number(userId), userType);
      this.server.emit('userOffline', { userId: Number(userId), userType });
      this.logger.log(`❌ ${userType} ${userName} (ID: ${userId}) disconnected`);
    }
  }

  // ========================================
  // Chat: Join Room
  // ========================================
  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { recipientId: number; recipientType: string },
  ) {
    const { userId, userType } = client.data;
    const roomId = this.chatService.getRoomId(
      userId, userType,
      data.recipientId, data.recipientType,
    );

    client.join(roomId);
    this.logger.log(`${userType} ${userId} joined room ${roomId}`);

    return { roomId };
  }

  // ========================================
  // Chat: Send Message
  // ========================================
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      recipientId: number;
      recipientType: string;
      content: string;
      patientId: number;
      doctorId: number;
    },
  ) {
    const { userId, userType, userName } = client.data;
    const roomId = this.chatService.getRoomId(
      userId, userType,
      data.recipientId, data.recipientType,
    );

    // Persist message
    const message = await this.chatService.saveMessage({
      senderId: userId,
      receiverId: data.recipientId,
      senderType: userType,
      content: data.content,
      patientId: data.patientId,
      doctorId: data.doctorId,
    });

    // Broadcast to room
    this.server.to(roomId).emit('receiveMessage', {
      ...message,
      senderName: userName,
    });

    // Also notify recipient's personal room (for unread badge updates)
    this.server.to(`user_${data.recipientId}_${data.recipientType}`).emit('newMessage', {
      ...message,
      senderName: userName,
      roomId,
    });

    return message;
  }

  // ========================================
  // Chat: Typing Indicator
  // ========================================
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { recipientId: number; recipientType: string },
  ) {
    const { userId, userType, userName } = client.data;
    const roomId = this.chatService.getRoomId(
      userId, userType,
      data.recipientId, data.recipientType,
    );

    client.to(roomId).emit('userTyping', {
      userId, userType, userName,
    });
  }

  @SubscribeMessage('stopTyping')
  handleStopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { recipientId: number; recipientType: string },
  ) {
    const { userId, userType, userName } = client.data;
    const roomId = this.chatService.getRoomId(
      userId, userType,
      data.recipientId, data.recipientType,
    );

    client.to(roomId).emit('userStopTyping', {
      userId, userType, userName,
    });
  }

  // ========================================
  // Chat: Mark as Read
  // ========================================
  @SubscribeMessage('markRead')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageIds: number[] },
  ) {
    await this.chatService.markMessagesRead(data.messageIds);

    // Notify the sender that messages were read
    this.server.emit('messagesRead', { messageIds: data.messageIds });
  }

  // ========================================
  // Video: Start Call (Signaling)
  // ========================================
  @SubscribeMessage('startCall')
  handleStartCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      recipientId: number;
      recipientType: string;
      sessionToken: string;
    },
  ) {
    const { userId, userType, userName } = client.data;
    const callRoomId = `call_${data.sessionToken}`;

    client.join(callRoomId);
    this.chatService.setActiveCall(data.sessionToken, {
      callerId: userId,
      callerType: userType,
      callerName: userName,
      recipientId: data.recipientId,
      recipientType: data.recipientType,
    });

    // Notify recipient of incoming call
    this.server.to(`user_${data.recipientId}_${data.recipientType}`).emit('incomingCall', {
      callerId: userId,
      callerType: userType,
      callerName: userName,
      sessionToken: data.sessionToken,
    });

    this.logger.log(`📞 ${userName} calling ${data.recipientType} ${data.recipientId} — session: ${data.sessionToken}`);
  }

  @SubscribeMessage('acceptCall')
  handleAcceptCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionToken: string },
  ) {
    const callRoomId = `call_${data.sessionToken}`;
    client.join(callRoomId);

    const call = this.chatService.getActiveCall(data.sessionToken);
    if (call) {
      this.server.to(callRoomId).emit('callAccepted', {
        sessionToken: data.sessionToken,
      });
    }
  }

  @SubscribeMessage('rejectCall')
  handleRejectCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionToken: string },
  ) {
    const callRoomId = `call_${data.sessionToken}`;
    this.server.to(callRoomId).emit('callRejected', {
      sessionToken: data.sessionToken,
    });
    this.chatService.removeActiveCall(data.sessionToken);
  }

  // ========================================
  // Video: WebRTC Signaling
  // ========================================
  @SubscribeMessage('offer')
  handleOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionToken: string; offer: any },
  ) {
    const callRoomId = `call_${data.sessionToken}`;
    client.to(callRoomId).emit('offer', {
      offer: data.offer,
      from: client.data.userId,
    });
  }

  @SubscribeMessage('answer')
  handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionToken: string; answer: any },
  ) {
    const callRoomId = `call_${data.sessionToken}`;
    client.to(callRoomId).emit('answer', {
      answer: data.answer,
      from: client.data.userId,
    });
  }

  @SubscribeMessage('iceCandidate')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionToken: string; candidate: any },
  ) {
    const callRoomId = `call_${data.sessionToken}`;
    client.to(callRoomId).emit('iceCandidate', {
      candidate: data.candidate,
      from: client.data.userId,
    });
  }

  @SubscribeMessage('endCall')
  handleEndCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionToken: string },
  ) {
    const callRoomId = `call_${data.sessionToken}`;
    this.server.to(callRoomId).emit('callEnded', {
      sessionToken: data.sessionToken,
      endedBy: client.data.userId,
    });
    this.chatService.removeActiveCall(data.sessionToken);
    this.logger.log(`📵 Call ended — session: ${data.sessionToken}`);
  }

  // ========================================
  // Utility: Get Online Users
  // ========================================
  @SubscribeMessage('getOnlineUsers')
  handleGetOnlineUsers() {
    return this.chatService.getOnlineUsers();
  }
}
