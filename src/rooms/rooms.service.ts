import { HttpStatus, Injectable } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { InjectModel } from "@nestjs/mongoose";
import { Observable } from "rxjs";
import { Model } from "mongoose";
import { GlobalErrorCodes } from "../exceptions/errorCodes/GlobalErrorCodes";
import { Rights } from "../utils/rights";
import { RightsDocument } from "./schemas/rights.schema";
import { RoomDocument } from "./schemas/room.schema";
import { RoomDto } from "./room.dto";

@Injectable()
export class RoomsService {
  constructor(
    @InjectModel("Room") private readonly roomModel: Model<RoomDocument>,
    @InjectModel("Rights") private readonly rightsModel: Model<RightsDocument>
  ) {}

  async addWelcomeChat(userId: string): Promise<HttpStatus | Observable<any> | RpcException> {
    try {
      const welcomeChat = await this.roomModel.findOne({ name: "ChatiZZe" });
      
      welcomeChat.id =  welcomeChat.id + userId;
      welcomeChat.usersID.push(userId);
  
      await welcomeChat.save();
      return HttpStatus.CREATED;
    } catch (e) {
      console.log(e.stack);
      return new RpcException({
        key: "INTERNAL_ERROR",
        code: GlobalErrorCodes.INTERNAL_ERROR.code,
        message: GlobalErrorCodes.INTERNAL_ERROR.value
      });
    }
  }

  async createRoom(userId: string, roomDto: RoomDto): Promise<HttpStatus | Observable<any> | RpcException> {
    try {
      const createdRoom = new this.roomModel(roomDto);
      createdRoom.usersID.push(userId);
      await createdRoom.save();
      return HttpStatus.CREATED;
    } catch (e) {
      console.log(e.stack);
      return new RpcException({
        key: "INTERNAL_ERROR",
        code: GlobalErrorCodes.INTERNAL_ERROR.code,
        message: GlobalErrorCodes.INTERNAL_ERROR.value
      });
    }
  }

  async getAllRooms(): Promise<RoomDocument[] | RpcException> {
    try {
      return this.roomModel.find();
    } catch (e) {
      console.log(e.stack);
      return new RpcException({
        key: "INTERNAL_ERROR",
        code: GlobalErrorCodes.INTERNAL_ERROR.code,
        message: GlobalErrorCodes.INTERNAL_ERROR.value
      });
    }
  }

  async getAllUserRooms(userId: string): Promise<RoomDocument[] | Observable<any> | RpcException> {
    try {
      const rooms = await this.getAllRooms();
      if (!(rooms instanceof RpcException)) {
        rooms.filter((item) => item.usersID.includes(userId));
      }
    } catch (e) {
      console.log(e.stack);
      return new RpcException({
        key: "INTERNAL_ERROR",
        code: GlobalErrorCodes.INTERNAL_ERROR.code,
        message: GlobalErrorCodes.INTERNAL_ERROR.value
      });
    }
  }

  async findRoomById(id: string): Promise<RoomDocument[] | Observable<any> | RpcException> {
    try {
      const regex = new RegExp(id, "i");
      return this.roomModel.find({ id: regex });
    } catch (e) {
      console.log(e.stack);
      return new RpcException({
        key: "INTERNAL_ERROR",
        code: GlobalErrorCodes.INTERNAL_ERROR.code,
        message: GlobalErrorCodes.INTERNAL_ERROR.value
      });
    }
  }

  async findRoomByName(name: string): Promise<RoomDocument[] | Observable<any> | RpcException> {
    try {
      const regex = new RegExp(name, "i");
      return this.roomModel.find({ name: regex });
    } catch (e) {
      console.log(e.stack);
      return new RpcException({
        key: "INTERNAL_ERROR",
        code: GlobalErrorCodes.INTERNAL_ERROR.code,
        message: GlobalErrorCodes.INTERNAL_ERROR.value
      });
    }
  }

  async updateRoom({
    rights,
    roomId,
    roomDto
  }: {
    rights: string[];
    roomId: string;
    roomDto: Partial<RoomDto>;
  }): Promise<HttpStatus | Observable<any> | RpcException> {
    try {
      if (rights.includes("CHANGE_ROOM")) {
        const room = await this.roomModel.findOne({ id: roomId });

        const updatedRoom = {
          usersID: roomDto.usersID ? roomDto.usersID : room.usersID,
          messagesID: roomDto.messagesID ? roomDto.messagesID : room.messagesID,
          _id: room._id,
          id: roomId,
          name: roomDto.name ? roomDto.name : room.name,
          description: roomDto.description ? roomDto.description : room.description,
          isUser: roomDto.isUser ? roomDto.isUser : room.isUser,
          isPrivate: roomDto.isPrivate ? roomDto.isPrivate : room.isPrivate,
          membersCount: roomDto.membersCount ? roomDto.membersCount : room.membersCount,
          createdAt: room.createdAt,
          updatedAt: new Date()
        };
        await this.roomModel.updateOne({ id: roomId }, updatedRoom);
        return HttpStatus.CREATED;
      }
      return HttpStatus.UNAUTHORIZED;
    } catch (e) {
      console.log(e.stack);
      return new RpcException({
        key: "INTERNAL_ERROR",
        code: GlobalErrorCodes.INTERNAL_ERROR.code,
        message: GlobalErrorCodes.INTERNAL_ERROR.value
      });
    }
  }

  async deleteRoom({ rights, roomId }: { rights: string[]; roomId: string }): Promise<HttpStatus | Observable<any> | RpcException> {
    try {
      if (rights.includes("DELETE_ROOM")) {
        const { deletedCount } = await this.roomModel.deleteOne({ id: roomId });

        if (deletedCount !== 0) {
          return HttpStatus.OK;
        } else {
          return HttpStatus.NOT_FOUND;
        }
      }
      return HttpStatus.UNAUTHORIZED;
    } catch (e) {
      console.log(e.stack);
      return new RpcException({
        key: "INTERNAL_ERROR",
        code: GlobalErrorCodes.INTERNAL_ERROR.code,
        message: GlobalErrorCodes.INTERNAL_ERROR.value
      });
    }
  }

  async deleteMessageFromRoom({
    rights,
    roomId,
    messageId
  }: {
    rights: string[];
    roomId: string;
    messageId: string;
  }): Promise<HttpStatus | Observable<any> | RpcException> {
    try {
      if (rights.includes("DELETE_MESSAGES")) {
        const searchResult = await this.roomModel.findOne({ id: roomId });

        const messagePosition = searchResult.messagesID.findIndex((item) => item === messageId);

        if (messagePosition > -1) {
          searchResult.messagesID.splice(messagePosition, 1);
          await this.roomModel.updateOne({ id: roomId }, searchResult);
          return HttpStatus.CREATED;
        } else {
          return HttpStatus.NOT_FOUND;
        }
      }
      return HttpStatus.UNAUTHORIZED;
    } catch (e) {
      console.log(e.stack);
      return new RpcException({
        key: "INTERNAL_ERROR",
        code: GlobalErrorCodes.INTERNAL_ERROR.code,
        message: GlobalErrorCodes.INTERNAL_ERROR.value
      });
    }
  }

  async addMessageReferenceToRoom({
    rights,
    messageId,
    roomId
  }: {
    rights: string[];
    messageId: string;
    roomId: string;
  }): Promise<HttpStatus | Observable<any> | RpcException> {
    try {
      if (rights.includes("SEND_MESSAGES")) {
        const searchResult = await this.roomModel.findOne({ id: roomId });

        searchResult.messagesID.push(messageId);

        await this.roomModel.updateOne({ id: roomId }, searchResult);

        return HttpStatus.CREATED;
      }
      return HttpStatus.UNAUTHORIZED;
    } catch (e) {
      console.log(e.stack);
      return new RpcException({
        key: "INTERNAL_ERROR",
        code: GlobalErrorCodes.INTERNAL_ERROR.code,
        message: GlobalErrorCodes.INTERNAL_ERROR.value
      });
    }
  }

  async addUserToRoom({
    rights,
    userId,
    roomId
  }: {
    rights: string[];
    userId: string;
    roomId: string;
  }): Promise<HttpStatus | Observable<any> | RpcException> {
    try {
      if (rights.includes("ADD_USERS")) {
        const searchResult = await this.roomModel.findOne({ id: roomId });

        if (searchResult) {
          searchResult.usersID.push(userId);

          await this.roomModel.updateOne({ id: roomId }, searchResult);

          return HttpStatus.CREATED;
        }
        return HttpStatus.BAD_REQUEST;
      }
      return HttpStatus.UNAUTHORIZED;
    } catch (e) {
      console.log(e.stack);
      return new RpcException({
        key: "INTERNAL_ERROR",
        code: GlobalErrorCodes.INTERNAL_ERROR.code,
        message: GlobalErrorCodes.INTERNAL_ERROR.value
      });
    }
  }

  async deleteUserFromRoom({
    rights,
    userId,
    roomId
  }: {
    rights: string[];
    userId: string;
    roomId: string;
  }): Promise<HttpStatus | Observable<any> | RpcException> {
    try {
      if (rights.includes("DELETE_USERS")) {
        const searchResult = await this.roomModel.findOne({ id: roomId });

        if (searchResult) {
          const userPosition = searchResult.usersID.findIndex((item) => item === userId);

          if (userPosition > -1) {
            searchResult.usersID.splice(userPosition, 1);
            await this.roomModel.updateOne({ id: roomId }, searchResult);
            return HttpStatus.CREATED;
          } else {
            return HttpStatus.NOT_FOUND;
          }
        }
        return HttpStatus.BAD_REQUEST;
      }
      return HttpStatus.UNAUTHORIZED;
    } catch (e) {
      console.log(e.stack);
      return new RpcException({
        key: "INTERNAL_ERROR",
        code: GlobalErrorCodes.INTERNAL_ERROR.code,
        message: GlobalErrorCodes.INTERNAL_ERROR.value
      });
    }
  }

  async changeUserRightsInRoom({
    rights,
    userId,
    roomId,
    newRights
  }: {
    rights: string[];
    userId: string;
    roomId: string;
    newRights: string[];
  }): Promise<HttpStatus | Observable<any> | RpcException> {
    try {
      if (!rights || !userId || !roomId || !newRights) {
        // TODO ERROR some data not provided
        return HttpStatus.BAD_REQUEST;
      }

      if (rights.includes("CHANGE_USER_RIGHTS")) {
        const { nModified } = await this.rightsModel.updateOne({ id: userId, roomId }, { rights: newRights });
        console.log(nModified);
        if (nModified > 0) {
          return HttpStatus.CREATED;
        } else {
          return HttpStatus.BAD_REQUEST;
        }
      }
      return HttpStatus.UNAUTHORIZED;
    } catch (e) {
      console.log(e.stack);
      return new RpcException({
        key: "INTERNAL_ERROR",
        code: GlobalErrorCodes.INTERNAL_ERROR.code,
        message: GlobalErrorCodes.INTERNAL_ERROR.value
      });
    }
  }

  async verifyRights(rights: string[], userId: string): Promise<boolean | Observable<any> | RpcException> {
    try {
      return await this.rightsModel.exists({ userId: userId, rights: rights });
    } catch (e) {
      console.log(e.stack);
      return new RpcException({
        key: "INTERNAL_ERROR",
        code: GlobalErrorCodes.INTERNAL_ERROR.code,
        message: GlobalErrorCodes.INTERNAL_ERROR.value
      });
    }
  }
}
