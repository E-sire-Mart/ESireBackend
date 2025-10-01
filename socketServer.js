const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const ChatRoom = require('./models/ChatRoom');
const Message = require('./models/Message');
const User = require('./models/User');

class SocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map(); // userId -> WebSocket
    this.rooms = new Map(); // roomId -> Set of userIds
    
    this.init();
  }

  init() {
    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });
  }

  async handleConnection(ws, req) {
    try {
      console.log('New WebSocket connection attempt');
      // Extract token from query string or headers
      const token = this.extractToken(req);
      if (!token) {
        console.log('No token provided, closing connection');
        ws.close(1008, 'Authentication required');
        return;
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;
      
      if (!userId) {
        ws.close(1008, 'Invalid token');
        return;
      }

      // Store client connection
      this.clients.set(userId, ws);
      
      // Mark user as online
      await User.findByIdAndUpdate(userId, { isOnline: true });
      
      // Get user info to check roles
      const user = await User.findById(userId);
      
      // Determine user roles from individual boolean fields
      const roles = [];
      if (user.isAdmin) roles.push('admin');
      if (user.is_owner) roles.push('vendor');
      if (user.isDelivery) roles.push('delivery');
      if (roles.length === 0) roles.push('user');
      
      console.log(`User ${userId} connected with roles:`, roles);
      
      // If this is an admin/shop admin/delivery user, broadcast their presence to all customers
      if (user && roles.some(role => ['admin', 'vendor', 'delivery'].includes(role))) {
        this.broadcastToAllCustomers({
          type: 'user_online',
          user: {
            id: user._id,
            name: user.username || user.first_name || 'User',
            roles: roles,
            isOnline: true,
            avatar: user.avatar
          }
        });
      }

      // Handle messages
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data);
          await this.handleMessage(userId, message);
        } catch (error) {
          console.error('Error handling message:', error);
          this.sendToClient(userId, {
            type: 'error',
            message: 'Invalid message format'
          });
        }
      });

      // Handle disconnection
      ws.on('close', async () => {
        await this.handleDisconnection(userId);
      });

      // Send connection confirmation
      this.sendToClient(userId, {
        type: 'connection',
        status: 'connected',
        userId
      });

    } catch (error) {
      console.error('Connection error:', error);
      ws.close(1008, 'Authentication failed');
    }
  }

  extractToken(req) {
    // Try to get token from query string
    const url = new URL(req.url, `http://${req.headers.host}`);
    let token = url.searchParams.get('token');
    
    // If not in query, try Authorization header
    if (!token && req.headers.authorization) {
      token = req.headers.authorization.replace('Bearer ', '');
    }
    
    return token;
  }

  async handleMessage(userId, message) {
    switch (message.type) {
      case 'join_room':
        await this.handleJoinRoom(userId, message);
        break;
      case 'leave_room':
        await this.handleLeaveRoom(userId, message);
        break;
      case 'send_message':
        await this.handleSendMessage(userId, message);
        break;
      case 'mark_read':
        await this.handleMarkRead(userId, message);
        break;
      case 'typing':
        await this.handleTyping(userId, message);
        break;
      case 'request_online_users':
        await this.handleRequestOnlineUsers(userId);
        break;
      case 'request_available_rooms':
        await this.handleRequestAvailableRooms(userId);
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  async handleJoinRoom(userId, message) {
    const { roomId, contactId, contactName } = message;
    
    try {
      // Get current user info
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Find or create chat room
      const room = await ChatRoom.findOrCreateRoom(
        userId,
        contactId,
        user.username || user.first_name || 'User',
        contactName
      );

      // Join the room
      if (!this.rooms.has(roomId)) {
        this.rooms.set(roomId, new Set());
      }
      this.rooms.get(roomId).add(userId);

      // Update participant status
      await room.updateParticipantStatus(userId, true);

      // Get recent messages
      const { messages } = await Message.getRoomMessages(roomId, 1, 50);

      // Send room info and messages
      this.sendToClient(userId, {
        type: 'room_joined',
        roomId,
        messages,
        participants: room.participants
      });

      // Notify other participants
      this.broadcastToRoom(roomId, userId, {
        type: 'user_joined',
        userId,
        username: user.username || user.first_name || 'User'
      });

      // BROADCAST ROOM AVAILABILITY TO ALL SYSTEMS
      // This ensures admin and shop admin dashboards know about the room
      await this.broadcastRoomAvailability(roomId, userId, contactId, user);

    } catch (error) {
      console.error('Error joining room:', error);
      this.sendToClient(userId, {
        type: 'error',
        message: 'Failed to join room'
      });
    }
  }

  async handleLeaveRoom(userId, message) {
    const { roomId } = message;
    
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).delete(userId);
      
      // Update participant status
      const room = await ChatRoom.findOne({ roomId });
      if (room) {
        await room.updateParticipantStatus(userId, false);
      }
    }
  }

  async handleSendMessage(userId, message) {
    console.log('handleSendMessage called with:', { userId, message });
    const { roomId, content, messageType = 'text' } = message;
    
    try {
      // Get user info
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Create message in database
      const newMessage = new Message({
        roomId,
        senderId: userId,
        senderName: user.username || user.first_name || 'User',
        content,
        messageType
      });
      await newMessage.save();

      // Update chat room
      const room = await ChatRoom.findOne({ roomId });
      if (room) {
        await room.addMessage(content, userId);
      }

      // Broadcast message to room
      this.broadcastToRoom(roomId, userId, {
        type: 'new_message',
        message: {
          id: newMessage._id,
          roomId,
          senderId: userId,
          senderName: newMessage.senderName,
          content,
          messageType,
          status: 'sent',
          timestamp: newMessage.createdAt
        }
      });

      // Also broadcast to all connected clients for real-time updates across systems
      this.broadcastToAllClients({
        type: 'new_message',
        message: {
          id: newMessage._id,
          roomId,
          senderId: userId,
          senderName: newMessage.senderName,
          content,
          messageType,
          status: 'sent',
          timestamp: newMessage.createdAt
        }
      });

      // Send confirmation to sender
      this.sendToClient(userId, {
        type: 'message_sent',
        messageId: newMessage._id,
        status: 'sent'
      });

    } catch (error) {
      console.error('Error sending message:', error);
      this.sendToClient(userId, {
        type: 'error',
        message: 'Failed to send message'
      });
    }
  }

  async handleMarkRead(userId, message) {
    const { roomId, messageIds } = message;
    
    try {
      // Mark messages as read
      if (messageIds && messageIds.length > 0) {
        for (const messageId of messageIds) {
          const msg = await Message.findById(messageId);
          if (msg) {
            await msg.markAsRead(userId);
          }
        }
      }

      // Update chat room unread count
      const room = await ChatRoom.findOne({ roomId });
      if (room) {
        await room.markAsRead(userId);
      }

      // Notify other participants
      this.broadcastToRoom(roomId, userId, {
        type: 'messages_read',
        userId,
        messageIds
      });

    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  async handleTyping(userId, message) {
    const { roomId, isTyping } = message;
    
    // Broadcast typing indicator
    this.broadcastToRoom(roomId, userId, {
      type: 'typing',
      userId,
      isTyping
    });
  }

  async handleRequestOnlineUsers(userId) {
    try {
      // Get all online admin/shop admin/delivery users
      const onlineUsers = await User.find({
        isOnline: true,
        $or: [
          { isAdmin: true },
          { is_owner: true },
          { isDelivery: true }
        ]
      });

      // Send the list to the requesting user
      this.sendToClient(userId, {
        type: 'online_users_list',
        users: onlineUsers.map(user => {
          // Determine user roles from individual boolean fields
          const roles = [];
          if (user.isAdmin) roles.push('admin');
          if (user.is_owner) roles.push('vendor');
          if (user.isDelivery) roles.push('delivery');
          if (roles.length === 0) roles.push('user');
          
          return {
            id: user._id,
            name: user.username || user.first_name || 'User',
            roles: roles,
            isOnline: true,
            avatar: user.avatar
          };
        })
      });

      console.log(`Sent online users list to user ${userId}:`, onlineUsers.length, 'users');
    } catch (error) {
      console.error('Error handling online users request:', error);
      this.sendToClient(userId, {
        type: 'error',
        message: 'Failed to get online users'
      });
    }
  }

  // Handle room discovery requests
  async handleRequestAvailableRooms(userId) {
    try {
      // Get all chat rooms where the user is a participant
      const userRooms = await ChatRoom.find({
        $or: [
          { 'participants.userId': userId },
          { 'participants.userId': { $exists: false } } // Include rooms without participant structure
        ]
      });

      // Get room details with participants and last messages
      const roomsWithDetails = await Promise.all(
        userRooms.map(async (room) => {
          const lastMessage = await Message.findOne({ roomId: room.roomId })
            .sort({ createdAt: -1 })
            .limit(1);
          
          return {
            roomId: room.roomId,
            participants: room.participants || [],
            lastMessage: lastMessage ? {
              content: lastMessage.content,
              timestamp: lastMessage.createdAt,
              senderId: lastMessage.senderId
            } : null,
            createdAt: room.createdAt
          };
        })
      );

      // Send available rooms to the user
      this.sendToClient(userId, {
        type: 'available_rooms_list',
        rooms: roomsWithDetails
      });

      console.log(`Sent available rooms list to user ${userId}:`, roomsWithDetails.length, 'rooms');
    } catch (error) {
      console.error('Error handling available rooms request:', error);
      this.sendToClient(userId, {
        type: 'error',
        message: 'Failed to get available rooms'
      });
    }
  }

  async handleDisconnection(userId) {
    // Remove from all rooms
    for (const [roomId, participants] of this.rooms.entries()) {
      if (participants.has(userId)) {
        participants.delete(userId);
        
        // Update participant status
        const room = await ChatRoom.findOne({ roomId });
        if (room) {
          await room.updateParticipantStatus(userId, false);
        }
      }
    }

    // Remove client
    this.clients.delete(userId);
    
    // Mark user as offline
    await User.findByIdAndUpdate(userId, { isOnline: false });
    
    // If this was an admin/shop admin/delivery user, broadcast their offline status to all customers
    try {
      const user = await User.findById(userId);
      if (user) {
        // Determine user roles from individual boolean fields
        const roles = [];
        if (user.isAdmin) roles.push('admin');
        if (user.is_owner) roles.push('vendor');
        if (user.isDelivery) roles.push('delivery');
        if (roles.length === 0) roles.push('user');
        
        if (roles.some(role => ['admin', 'vendor', 'delivery'].includes(role))) {
          this.broadcastToAllCustomers({
            type: 'user_offline',
            user: {
              id: user._id,
              name: user.username || user.first_name || 'User',
              roles: roles,
              isOnline: false,
              avatar: user.avatar
            }
          });
        }
      }
    } catch (error) {
      console.error('Error broadcasting offline status:', error);
    }
    
    console.log(`User ${userId} disconnected`);
  }

  sendToClient(userId, data) {
    const ws = this.clients.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  broadcastToRoom(roomId, excludeUserId, data) {
    const participants = this.rooms.get(roomId);
    if (participants) {
      participants.forEach(userId => {
        if (userId !== excludeUserId) {
          this.sendToClient(userId, data);
        }
      });
    }
  }

  // Get online users in a room
  getOnlineUsersInRoom(roomId) {
    const participants = this.rooms.get(roomId);
    if (participants) {
      return Array.from(participants);
    }
    return [];
  }

  // Broadcast to all customers (users with 'user' role)
  async broadcastToAllCustomers(data) {
    try {
      // Get all customers from database (users who are not admin, vendor, or delivery)
      const customers = await User.find({
        isAdmin: false,
        is_owner: false,
        isDelivery: false
      });
      
      // Send to all connected customers
      customers.forEach(customer => {
        if (this.clients.has(customer._id.toString())) {
          this.sendToClient(customer._id.toString(), data);
        }
      });
      
      console.log(`Broadcasted to ${customers.length} customers:`, data.type);
    } catch (error) {
      console.error('Error broadcasting to customers:', error);
    }
  }

  // Broadcast to all connected clients
  broadcastToAllClients(data) {
    this.clients.forEach((ws, clientUserId) => {
      try {
        ws.send(JSON.stringify(data));
      } catch (error) {
        console.error(`Error broadcasting to client ${clientUserId}:`, error);
      }
    });
  }

  // Broadcast room availability to all connected systems (admin, shop admin, customer)
  async broadcastRoomAvailability(roomId, initiatorId, contactId, initiatorUser) {
    try {
      console.log(`Broadcasting room availability: ${roomId} to all systems`);
      
      // Get the other participant in the room
      const otherParticipant = await User.findById(contactId);
      if (!otherParticipant) {
        console.log('Other participant not found, skipping broadcast');
        return;
      }

      // Determine initiator roles from individual boolean fields
      const initiatorRoles = [];
      if (initiatorUser.isAdmin) initiatorRoles.push('admin');
      if (initiatorUser.is_owner) initiatorRoles.push('vendor');
      if (initiatorUser.isDelivery) initiatorRoles.push('delivery');
      if (initiatorRoles.length === 0) initiatorRoles.push('user');

      // Determine participant roles from individual boolean fields
      const participantRoles = [];
      if (otherParticipant.isAdmin) participantRoles.push('admin');
      if (otherParticipant.is_owner) participantRoles.push('vendor');
      if (otherParticipant.isDelivery) participantRoles.push('delivery');
      if (participantRoles.length === 0) participantRoles.push('user');

      // Create room availability data
      const roomData = {
        type: 'room_available',
        roomId,
        initiator: {
          id: initiatorId,
          name: initiatorUser.username || initiatorUser.first_name || 'User',
          roles: initiatorRoles
        },
        participant: {
          id: contactId,
          name: otherParticipant.username || otherParticipant.first_name || 'User',
          roles: participantRoles
        },
        timestamp: new Date()
      };

      // Broadcast to all connected users (admin, shop admin, customer)
      for (const [connectedUserId, ws] of this.clients.entries()) {
        // Skip the initiator
        if (connectedUserId === initiatorId) continue;
        
        // Send room availability notification
        this.sendToClient(connectedUserId, roomData);
      }
      
      console.log(`Room availability broadcasted to ${this.clients.size - 1} connected users`);
    } catch (error) {
      console.error('Error broadcasting room availability:', error);
    }
  }
}

module.exports = SocketServer;
