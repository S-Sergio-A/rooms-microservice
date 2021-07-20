import { HttpStatus, Injectable } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Observable } from "rxjs";
import { GlobalErrorCodes } from "../exceptions/errorCodes/GlobalErrorCodes";
import { RightsDocument } from "./schemas/rights.schema";
import { RoomDocument } from "./schemas/room.schema";
import { UserDocument } from "./schemas/user.schema";
import { RoomDto } from "./room.dto";

@Injectable()
export class RoomsService {
  constructor(
    @InjectModel("Room") private readonly roomModel: Model<RoomDocument>,
    @InjectModel("Right") private readonly rightsModel: Model<RightsDocument>,
    @InjectModel("User") private readonly userModel: Model<UserDocument>
  ) {}

  async addWelcomeChat(userId: string): Promise<HttpStatus | Observable<any> | RpcException> {
    try {
      const welcomeChat = await this.roomModel.findOne({ name: "ChatiZZe" });

      welcomeChat.id = welcomeChat.id + userId;
      welcomeChat.usersID.push(new Types.ObjectId(userId));

      await welcomeChat.save();

      await this.rightsModel.create({
        user: userId,
        roomId: welcomeChat._id,
        rights: ["DELETE_ROOM"]
      });
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
      createdRoom.usersID.push(new Types.ObjectId(userId));
      await createdRoom.save();

      await this.rightsModel.create({
        user: new Types.ObjectId(userId),
        roomId: createdRoom._id,
        rights: [
          "SEND_MESSAGES",
          "SEND_ATTACHMENTS",
          "DELETE_MESSAGES",
          "ADD_USERS",
          "DELETE_USERS",
          "CHANGE_USER_RIGHTS",
          "CHANGE_ROOM",
          "DELETE_ROOM",
          "UPDATE_MESSAGE"
        ]
      });
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
      return this.roomModel.find().populate("user", "id firstName lastName birthday username email phoneNumber photo", this.userModel);
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
      let userRooms: RoomDocument[];

      const rooms = await this.getAllRooms();

      if (!(rooms instanceof RpcException)) {
        userRooms = rooms.filter((item) => item.usersID.includes(new Types.ObjectId(userId)));
      }

      return userRooms;
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
    userId,
    roomId,
    roomDto
  }: {
    rights: string[];
    userId: string;
    roomId: string;
    roomDto: Partial<RoomDto>;
  }): Promise<HttpStatus | Observable<any> | RpcException> {
    try {
      if (rights.includes("CHANGE_ROOM") && (await this._verifyRights(rights, new Types.ObjectId(userId)))) {
        const room = await this.roomModel.findOne({ id: roomId });

        const updatedRoom = {
          usersID: room.usersID,
          messagesID: room.messagesID,
          _id: room._id,
          name: roomDto.name ? roomDto.name : room.name,
          description: roomDto.description ? roomDto.description : room.description,
          isUser: room.isUser,
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

  async deleteRoom({
    rights,
    userId,
    roomId
  }: {
    rights: string[];
    userId: string;
    roomId: string;
  }): Promise<HttpStatus | Observable<any> | RpcException> {
    try {
      if (rights.includes("DELETE_ROOM") && (await this._verifyRights(rights, new Types.ObjectId(userId)))) {
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
    userId,
    roomId,
    messageId
  }: {
    rights: string[];
    userId: string;
    roomId: string;
    messageId: string;
  }): Promise<HttpStatus | Observable<any> | RpcException> {
    try {
      if (rights.includes("DELETE_MESSAGES") && (await this._verifyRights(rights, new Types.ObjectId(userId)))) {
        const searchResult = await this.roomModel.findOne({ id: roomId });

        const messagePosition = searchResult.messagesID.findIndex((item) => item === new Types.ObjectId(messageId));

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
    userId,
    messageId,
    roomId
  }: {
    rights: string[];
    userId: string;
    messageId: string;
    roomId: string;
  }): Promise<HttpStatus | Observable<any> | RpcException> {
    try {
      if (rights.includes("SEND_MESSAGES") && (await this._verifyRights(rights, new Types.ObjectId(userId)))) {
        const searchResult = await this.roomModel.findOne({ id: roomId });

        searchResult.messagesID.push(new Types.ObjectId(messageId));

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
      if (rights.includes("ADD_USERS") && (await this._verifyRights(rights, new Types.ObjectId(userId)))) {
        const searchResult = await this.roomModel.findOne({ id: roomId });

        if (searchResult) {
          searchResult.usersID.push(new Types.ObjectId(userId));

          await this.roomModel.updateOne({ id: roomId }, searchResult);

          return HttpStatus.CREATED;
        }
        return HttpStatus.BAD_REQUEST;
      } else {
        return HttpStatus.UNAUTHORIZED;
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
      if (rights.includes("DELETE_USERS") && (await this._verifyRights(rights, new Types.ObjectId(userId)))) {
        const searchResult = await this.roomModel.findOne({ id: roomId });

        if (searchResult) {
          const userPosition = searchResult.usersID.findIndex((item) => item === new Types.ObjectId(userId));

          if (userPosition > -1) {
            searchResult.usersID.splice(userPosition, 1);
            await this.roomModel.updateOne({ id: roomId }, searchResult);
            return HttpStatus.CREATED;
          } else {
            return HttpStatus.NOT_FOUND;
          }
        } else {
          return HttpStatus.BAD_REQUEST;
        }
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
      if (rights.includes("CHANGE_USER_RIGHTS") && (await this._verifyRights(rights, new Types.ObjectId(userId)))) {
        const { nModified } = await this.rightsModel.updateOne({ user: new Types.ObjectId(userId), roomId: new Types.ObjectId(roomId) }, { rights: newRights });
        console.log(nModified);
        if (nModified > 0) {
          return HttpStatus.CREATED;
        } else {
          return HttpStatus.BAD_REQUEST;
        }
      } else {
        return HttpStatus.UNAUTHORIZED;
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

  async loadRights(user: string, roomId: string): Promise<RightsDocument | RpcException> {
    try {
      return await this.rightsModel.findOne({ user: new Types.ObjectId(user), roomId: new Types.ObjectId(roomId) });
    } catch (e) {
      console.log(e.stack);
      return new RpcException({
        key: "INTERNAL_ERROR",
        code: GlobalErrorCodes.INTERNAL_ERROR.code,
        message: GlobalErrorCodes.INTERNAL_ERROR.value
      });
    }
  }

  private async _verifyRights(rights: string[], user: Types.ObjectId): Promise<boolean | Observable<any> | RpcException> {
    try {
      return await this.rightsModel.exists({ user, rights });
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
