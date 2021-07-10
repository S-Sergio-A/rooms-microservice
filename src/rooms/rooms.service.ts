import { HttpStatus, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Request } from "express";
import { Model } from "mongoose";
import { GlobalErrorCodes } from "../exceptions/errorCodes/GlobalErrorCodes";
import { InternalException } from "../exceptions/Internal.exception";
import { RightsDocument } from "./schemas/rights.schema";
import { RoomDocument } from "./schemas/room.schema";
import { RoomDto } from "./dto/room.dto";
import { Rights } from "../utils/rights";

@Injectable()
export class RoomsService {
  constructor(
    @InjectModel("Room") private readonly roomModel: Model<RoomDocument>,
    @InjectModel("Rights") private readonly rightsModel: Model<RightsDocument>
  ) {}

  // @MessagePattern("create-room")
  async createRoom(roomDto: RoomDto): Promise<HttpStatus> {
    const createdRoom = new this.roomModel(roomDto);

    await createdRoom.save();
    return HttpStatus.CREATED;
  }

  async getAllRooms(): Promise<RoomDocument[]> {
    return this.roomModel.find();
  }

  async findRoomById(req: Request): Promise<RoomDocument[] | null> {
    const regex = new RegExp(req.params.id, "i");
    return this.roomModel.find({ id: regex });
  }

  async findRoomByName(req: Request): Promise<RoomDocument[] | null> {
    const regex = new RegExp(req.params.name, "i");
    return this.roomModel.find({ name: regex });
    // return this.roomModel.findOne({ name: req.params.name });
  }

  async updateRoom(req: Request, roomDto: Partial<RoomDto>): Promise<HttpStatus> {
    if (req.rights.includes("CHANGE_ROOM")) {
      const room = await this.roomModel.findOne({ id: req.params.id });

      const updatedRoom = {
        usersID: roomDto.usersID ? roomDto.usersID : room.usersID,
        messagesID: roomDto.messagesID ? roomDto.messagesID : room.messagesID,
        _id: room._id,
        id: req.params.id,
        name: roomDto.name ? roomDto.name : room.name,
        description: roomDto.description ? roomDto.description : room.description,
        isUser: roomDto.isUser ? roomDto.isUser : room.isUser,
        isPrivate: roomDto.isPrivate ? roomDto.isPrivate : room.isPrivate,
        membersCount: roomDto.membersCount ? roomDto.membersCount : room.membersCount,
        createdAt: room.createdAt,
        updatedAt: new Date()
      };
      await this.roomModel.updateOne({ id: req.params.id }, updatedRoom);
      return HttpStatus.CREATED;
    }
    return HttpStatus.UNAUTHORIZED;
  }

  async deleteRoom(req: Request): Promise<HttpStatus> {
    if (req.rights.includes("DELETE_ROOM")) {
      const { deletedCount } = await this.roomModel.deleteOne({ id: req.params.id });

      if (deletedCount !== 0) {
        return HttpStatus.OK;
      } else {
        return HttpStatus.NOT_FOUND;
      }
    }
    return HttpStatus.UNAUTHORIZED;
  }

  async deleteMessageFromRoom(req: Request, messageId: string, roomId: string): Promise<HttpStatus> {
    if (req.rights.includes("DELETE_MESSAGES")) {
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
  }

  async addMessageReferenceToRoom(req: Request, messageId: string, roomId: string): Promise<HttpStatus> {
    if (req.rights.includes("SEND_MESSAGES")) {
      const searchResult = await this.roomModel.findOne({ id: roomId });

      searchResult.messagesID.push(messageId);

      await this.roomModel.updateOne({ id: roomId }, searchResult);

      return HttpStatus.CREATED;
    }
    return HttpStatus.UNAUTHORIZED;
  }

  async addUserToRoom(req: Request, userId: string, roomId: string): Promise<HttpStatus> {
    if (req.rights.includes("ADD_USERS")) {
      const searchResult = await this.roomModel.findOne({ id: roomId });

      searchResult.usersID.push(userId);

      await this.roomModel.updateOne({ id: roomId }, searchResult);

      return HttpStatus.CREATED;
    }
    return HttpStatus.UNAUTHORIZED;
  }

  async deleteUserFromRoom(req: Request, userId: string, roomId: string): Promise<HttpStatus> {
    if (req.rights.includes("DELETE_USERS")) {
      const searchResult = await this.roomModel.findOne({ id: roomId });

      const userPosition = searchResult.usersID.findIndex((item) => item === userId);

      if (userPosition > -1) {
        searchResult.usersID.splice(userPosition, 1);
        await this.roomModel.updateOne({ id: roomId }, searchResult);
        return HttpStatus.CREATED;
      } else {
        return HttpStatus.NOT_FOUND;
      }
    }
    return HttpStatus.UNAUTHORIZED;
  }

  async changeUserRightsInRoom(req: Request, userId: string, roomId: string, newRights: string[]): Promise<HttpStatus> {
    if (req.rights.includes("CHANGE_USER_RIGHTS")) {
      await this.rightsModel.updateOne({ id: userId, roomId }, { rights: newRights });

      return HttpStatus.CREATED;
    }
    return HttpStatus.UNAUTHORIZED;
  }

  async verifyRights(req: Request): Promise<boolean> {
    let rights: typeof Rights;

    if (typeof req.headers["rights"] === "string") {
      rights = JSON.parse(req.headers["rights"].toString());
    } else if (Array.isArray(req.headers["rights"])) {
      rights = req.headers["rights"];
    }

    // return await this.rightsModel.exists({ userId: req.user.userId, rights: rights });
    req.rights = rights;
    return true;
  }
}
