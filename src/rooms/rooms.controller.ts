import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Post, Put, Req, UseFilters } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";
import { Request } from "express";
import { RequestBodyAndInternalExceptionFilter } from "../exceptions/filters/RequestBodyAndInternal.exception-filter";
import { ValidationExceptionFilter } from "../exceptions/filters/Validation.exception-filter";
import { RoomValidationPipe } from "../pipes/validation/room.validation.pipe";
import { RoomDocument } from "./schemas/room.schema";
import { RoomsService } from "./rooms.service";
import { RoomDto } from "./dto/room.dto";

@UseFilters(new RequestBodyAndInternalExceptionFilter(), new ValidationExceptionFilter())
@Controller("rooms")
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  // @MessagePattern({ cmd: 'create-room' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createRoom(@Body(new RoomValidationPipe()) roomDto: RoomDto) {
    return await this.roomsService.createRoom(roomDto);
  }

  // @MessagePattern({ cmd: 'get-all-rooms' })
  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllRooms(): Promise<RoomDocument[]> {
    return await this.roomsService.getAllRooms();
  }

  // @MessagePattern({ cmd: 'find-room-by-name' })
  @Get("/room/:name")
  @HttpCode(HttpStatus.OK)
  async findRoomByName(@Req() req: Request): Promise<RoomDocument[]> {
    return await this.roomsService.findRoomByName(req);
  }

  // @MessagePattern({ cmd: 'update-room' })
  @Put("/room/:id")
  @HttpCode(HttpStatus.CREATED)
  async updateRoom(@Req() req: Request, @Body() roomDto: Partial<RoomDto>) {
    return await this.roomsService.updateRoom(req, roomDto);
  }

  // @MessagePattern({ cmd: 'delete-room' })
  @Delete("/room/:id")
  @HttpCode(HttpStatus.OK)
  public async deleteRoom(@Req() req: Request) {
    return await this.roomsService.deleteRoom(req);
  }

  // @MessagePattern({ cmd: "add-message-reference" })
  @Put("/message")
  @HttpCode(HttpStatus.CREATED)
  public async addMessageReferenceToRoom(@Req() req: Request, @Body() { messageId, roomId }: { messageId: string; roomId: string }) {
    return await this.roomsService.addMessageReferenceToRoom(req, messageId, roomId);
  }

  // @MessagePattern({ cmd: "delete-message-reference" })
  @Delete("/message")
  @HttpCode(HttpStatus.OK)
  public async deleteMessageReferenceFromRoom(@Req() req: Request, @Body() { messageId, roomId }: { messageId: string; roomId: string }) {
    return await this.roomsService.deleteMessageFromRoom(req, messageId, roomId);
  }

  // @MessagePattern({ cmd: "add-user" })
  @Put("/user")
  @HttpCode(HttpStatus.CREATED)
  public async addUserToRoom(@Req() req: Request, @Body() { userId, roomId }: { userId: string; roomId: string }) {
    return await this.roomsService.addUserToRoom(req, userId, roomId);
  }

  // @MessagePattern({ cmd: "delete-user" })
  @Delete("/user")
  @HttpCode(HttpStatus.OK)
  public async deleteUserFromRoom(@Req() req: Request, @Body() { userId, roomId }: { userId: string; roomId: string }) {
    return await this.roomsService.deleteUserFromRoom(req, userId, roomId);
  }

  // @MessagePattern({ cmd: "change-user-rights" })
  @Put("/user-rights")
  @HttpCode(HttpStatus.OK)
  public async changeUserRightsInRoom(
    @Req() req: Request,
    @Body() { userId, roomId, newRights }: { userId: string; roomId: string; newRights: string[] }
  ) {
    return await this.roomsService.changeUserRightsInRoom(req, userId, roomId, newRights);
  }
}
