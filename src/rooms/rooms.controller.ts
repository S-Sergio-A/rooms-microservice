import { Controller, HttpStatus, UseFilters } from "@nestjs/common";
import { MessagePattern, Payload, RpcException, Transport } from "@nestjs/microservices";
import { Observable } from "rxjs";
import { ExceptionFilter } from "../exceptions/filters/Exception.filter";
import { RoomDocument } from "./schemas/room.schema";
import { RoomsService } from "./rooms.service";
import { RoomDto } from "./room.dto";

@UseFilters(ExceptionFilter)
@Controller("rooms")
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

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
  async getAllRooms(): Promise<RoomDocument[] | Observable<any> | RpcException> {
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
    @Payload() data: { rights: string[]; roomId: string; roomDto: Partial<RoomDto> }
  ): Promise<HttpStatus | Observable<any> | RpcException> {
    return await this.roomsService.updateRoom(data);
  }

  @MessagePattern({ cmd: "delete-room" }, Transport.REDIS)
  public async deleteRoom(@Payload() data: { rights: string[]; roomId: string }): Promise<HttpStatus | Observable<any> | RpcException> {
    return await this.roomsService.deleteRoom(data);
  }

  @MessagePattern({ cmd: "add-message-reference" }, Transport.REDIS)
  public async addMessageReferenceToRoom(
    @Payload() data: { rights: string[]; roomId: string; messageId: string }
  ): Promise<HttpStatus | Observable<any> | RpcException> {
    return await this.roomsService.addMessageReferenceToRoom(data);
  }

  @MessagePattern({ cmd: "delete-message-reference" }, Transport.REDIS)
  public async deleteMessageReferenceFromRoom(
    @Payload() data: { rights: string[]; messageId: string; roomId: string }
  ): Promise<HttpStatus | Observable<any> | RpcException> {
    return await this.roomsService.deleteMessageFromRoom(data);
  }

  @MessagePattern({ cmd: "add-user" }, Transport.REDIS)
  public async addUserToRoom(
    @Payload() data: { rights: string[]; userId: string; roomId: string }
  ): Promise<HttpStatus | Observable<any> | RpcException> {
    return await this.roomsService.addUserToRoom(data);
  }

  @MessagePattern({ cmd: "delete-user" }, Transport.REDIS)
  public async deleteUserFromRoom(
    @Payload() data: { rights: string[]; userId: string; roomId: string }
  ): Promise<HttpStatus | Observable<any> | RpcException> {
    return await this.roomsService.deleteUserFromRoom(data);
  }

  @MessagePattern({ cmd: "change-user-rights" }, Transport.REDIS)
  public async changeUserRightsInRoom(
    @Payload() data: { rights: string[]; userId: string; roomId: string; newRights: string[] }
  ): Promise<HttpStatus | Observable<any> | RpcException> {
    return await this.roomsService.changeUserRightsInRoom(data);
  }
}
