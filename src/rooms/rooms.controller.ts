import { MessagePattern, Payload, RpcException, Transport } from "@nestjs/microservices";
import { Controller, HttpStatus, UseFilters } from "@nestjs/common";
import { Observable } from "rxjs";
import { ExceptionFilter } from "../exceptions/filters/Exception.filter";
import { NotificationsDocument } from "./schemas/notifications.schema";
import { RightsDocument } from "./schemas/rights.schema";
import { RoomDocument } from "./schemas/room.schema";
import { RoomsService } from "./rooms.service";
import { RoomDto } from "./room.dto";

@UseFilters(ExceptionFilter)
@Controller("rooms")
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}
  
  @MessagePattern({ cmd: "invoke" }, Transport.REDIS)
  async invoke(): Promise<void> {
    console.log("rooms-service invoked");
  }
  
  @MessagePattern({ cmd: "add-welcome-chat" }, Transport.REDIS)
  async addWelcomeChat(@Payload() userId: string): Promise<HttpStatus | Observable<any> | RpcException> {
    return await this.roomsService.addWelcomeChat(userId);
  }

  @MessagePattern({ cmd: "create-room" }, Transport.REDIS)
  async createRoom(
    @Payload() { userId, roomDto }: { roomDto: RoomDto; userId: string }
  ): Promise<HttpStatus | Observable<any> | RpcException> {
    return await this.roomsService.createRoom(userId, roomDto);
  }

  @MessagePattern({ cmd: "get-all-rooms" }, Transport.REDIS)
  async getAllRooms(): Promise<any[] | Observable<any> | RpcException> {
    return await this.roomsService.getAllRooms();
  }

  @MessagePattern({ cmd: "get-all-user-rooms" }, Transport.REDIS)
  async getAllUserRooms(@Payload() { userId }: { userId: string }): Promise<RoomDocument[] | Observable<any> | RpcException> {
    return await this.roomsService.getAllUserRooms(userId);
  }

  @MessagePattern({ cmd: "find-room-by-name" }, Transport.REDIS)
  async findRoomByName(@Payload() { name }: { name: string }): Promise<RoomDocument[] | Observable<any> | RpcException> {
    return await this.roomsService.findRoomByName(name);
  }

  @MessagePattern({ cmd: "update-room" }, Transport.REDIS)
  async updateRoom(
    @Payload() { rights, userId, roomId, roomDto }: { rights: string[]; userId: string; roomId: string; roomDto: Partial<RoomDto> }
  ): Promise<HttpStatus | Observable<any> | RpcException> {
    return await this.roomsService.updateRoom(rights, userId, roomId, roomDto);
  }
  
  @MessagePattern({ cmd: "change-room-photo" }, Transport.REDIS)
  async changeRoomPhoto(
    @Payload() { rights, userId, roomId, photo }: { rights: string[]; userId: string; roomId: string; photo: any }
  ): Promise<HttpStatus | Observable<any> | RpcException> {
    return await this.roomsService.changeRoomPhoto(rights, userId, roomId, photo);
  }

  @MessagePattern({ cmd: "delete-room" }, Transport.REDIS)
  public async deleteRoom(
    @Payload() { rights, userId, roomId }: { rights: string[]; userId: string; roomId: string }
  ): Promise<HttpStatus | Observable<any> | RpcException> {
    return await this.roomsService.deleteRoom(rights, userId, roomId);
  }

  @MessagePattern({ cmd: "add-message-reference" }, Transport.REDIS)
  public async addMessageReferenceToRoom(
    @Payload() { rights, userId, messageId, roomId }: { rights: string[]; userId: string; messageId: string; roomId: string }
  ): Promise<HttpStatus | Observable<any> | RpcException> {
    return await this.roomsService.addMessageReferenceToRoom(rights, userId, messageId, roomId);
  }

  @MessagePattern({ cmd: "delete-message-reference" }, Transport.REDIS)
  public async deleteMessageReferenceFromRoom(
    @Payload() { rights, userId, roomId, messageId }: { rights: string[]; userId: string; roomId: string; messageId: string }
  ): Promise<HttpStatus | Observable<any> | RpcException> {
    return await this.roomsService.deleteMessageFromRoom(rights, userId, roomId, messageId);
  }

  @MessagePattern({ cmd: "add-user" }, Transport.REDIS)
  public async addUserToRoom(
    @Payload()
    {
      rights,
      userId,
      roomId,
      newUserIdentifier,
      userRights
    }: {
      rights: string[];
      userId: string;
      roomId: string;
      newUserIdentifier: string;
      userRights: string[];
    }
  ): Promise<HttpStatus | Observable<any> | RpcException> {
    return await this.roomsService.addUserToRoom(rights, userId, roomId, newUserIdentifier, userRights);
  }

  @MessagePattern({ cmd: "delete-user" }, Transport.REDIS)
  public async deleteUserFromRoom(
    @Payload() { rights, userId, roomId, type }: { rights: string[]; userId: string; roomId: string; type: "DELETE_USER" | "LEAVE_ROOM" }
  ): Promise<HttpStatus | Observable<any> | RpcException> {
    return await this.roomsService.deleteUserFromRoom(rights, userId, roomId, type);
  }

  @MessagePattern({ cmd: "change-user-rights" }, Transport.REDIS)
  public async changeUserRightsInRoom(
    @Payload() { rights, userId, roomId, newRights }: { rights: string[]; userId: string; roomId: string; newRights: string[] }
  ): Promise<HttpStatus | Observable<any> | RpcException> {
    return await this.roomsService.changeUserRightsInRoom(rights, userId, roomId, newRights);
  }

  @MessagePattern({ cmd: "get-notifications-settings" }, Transport.REDIS)
  async getUserNotificationsSettings(@Payload() userId: string): Promise<NotificationsDocument[] | RpcException> {
    return await this.roomsService.getUserNotificationsSettings(userId);
  }

  @MessagePattern({ cmd: "change-notifications-settings" }, Transport.REDIS)
  async changeNotificationSettings(
    @Payload() { userId, roomId, notifications }: { roomId: string; userId: string; notifications: boolean }
  ): Promise<HttpStatus | Observable<any> | RpcException> {
    return await this.roomsService.changeNotificationSettings(userId, roomId, notifications);
  }

  @MessagePattern({ cmd: "load-rights" }, Transport.REDIS)
  async loadRights(@Payload() { userId, roomId }: { userId: string; roomId: string }): Promise<RightsDocument | RpcException> {
    return await this.roomsService.loadRights(userId, roomId);
  }
}
