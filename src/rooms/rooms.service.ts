import { HttpStatus, Injectable } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Observable } from "rxjs";
import { GlobalErrorCodes } from "../exceptions/errorCodes/GlobalErrorCodes";
import { NotificationsDocument } from "./schemas/notifications.schema";
import { MessageDocument } from "./schemas/message.schema";
import { RightsDocument } from "./schemas/rights.schema";
import { RoomDocument } from "./schemas/room.schema";
import { UserDocument } from "./schemas/user.schema";
import { RoomDto } from "./dto/room.dto";
import { RecentMessageDto } from "./dto/recentMessage.dto";

const cloudinary = require("cloudinary").v2;

@Injectable()
export class RoomsService {
  constructor(
    @InjectModel("Room") private readonly roomModel: Model<RoomDocument>,
    @InjectModel("Messages") private readonly messageModel: Model<MessageDocument>,
    @InjectModel("Rights") private readonly rightsModel: Model<RightsDocument>,
    @InjectModel("Notifications") private readonly notificationsModel: Model<NotificationsDocument>,
    @InjectModel("User") private readonly userModel: Model<UserDocument>
  ) {}

  async addWelcomeChat(userId: string): Promise<HttpStatus | Observable<any> | RpcException> {
    try {
      const welcomeChat = await this.roomModel.findOne({ name: "ChatiZZe" });

      welcomeChat.id = welcomeChat.id + userId;
      welcomeChat.usersID = [new Types.ObjectId(userId)];

      await welcomeChat.save();

      await this.rightsModel.create({
        user: new Types.ObjectId(userId),
        roomId: welcomeChat.id + userId,
        rights: ["DELETE_ROOM"]
      });

      await this.__setUserNotificationsSettings(new Types.ObjectId(userId), new Types.ObjectId(welcomeChat.id + userId), true);
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
      createdRoom.photo = "https://via.placeholder.com/60";
      createdRoom.recentMessage = {
        _id: "",
        text: "loading...",
        roomId: createdRoom._id,
        attachment: ["loading..."],
        timestamp: "loading...",
        user: {
          _id: "br",
          username: "Loading..."
        }
      };

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
      await this.__setUserNotificationsSettings(new Types.ObjectId(userId), createdRoom._id, true);
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

  async getAllRooms(): Promise<(RoomDocument | { recentMessage: any })[] | RpcException> {
    try {
      const rooms = await this.roomModel.find();

      return rooms;
    } catch (e) {
      console.log(e.stack);
      return new RpcException({
        key: "INTERNAL_ERROR",
        code: GlobalErrorCodes.INTERNAL_ERROR.code,
        message: GlobalErrorCodes.INTERNAL_ERROR.value
      });
    }
  }

  async getAllUserRooms(userId: string): Promise<
    | (RoomDocument & {
        recentMessage: {
          _id: string;
          user: {
            _id: string;
            username: string;
          };
          roomId: string;
          text: string;
          attachment: string[];
          timestamp: string;
        };
      })[]
    | Observable<any>
    | RpcException
  > {
    try {
      let result: any[] = [];

      const userRooms = await this.roomModel
        .find()
        .populate("usersID", "_id firstName lastName birthday username email phoneNumber photo", this.userModel);

      // O^2
      if (!(userRooms instanceof RpcException)) {
        for (let i = 0; i < userRooms.length; i++) {
          const idsArrLen = userRooms[i].usersID.length;
          for (let k = 0; k < idsArrLen; k++) {
            // @ts-ignore
            if (userRooms[i].usersID[k]._id.toString() === userId) {
              result.push(userRooms[i]);
            }
          }
        }
      }

      return result;
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
      return await this.roomModel.find({ id: regex });
    } catch (e) {
      console.log(e.stack);
      return new RpcException({
        key: "INTERNAL_ERROR",
        code: GlobalErrorCodes.INTERNAL_ERROR.code,
        message: GlobalErrorCodes.INTERNAL_ERROR.value
      });
    }
  }

  async findRoomByName(name: string, userId: string): Promise<RoomDocument[] | Observable<any> | RpcException> {
    try {
      const regex = new RegExp(name, "i");
      const rooms = await this.roomModel.find({ name: regex });

      const publicRoomsSet: any = new Set();
      const publicRoomsArray = rooms.filter((item: RoomDocument) => item.isPrivate === false);
      publicRoomsArray.forEach(publicRoomsSet.add, publicRoomsSet);

      for (let i = 0; i < rooms.length; i++) {
        if (rooms[i].usersID.includes(new Types.ObjectId(userId))) {
          publicRoomsSet.add(rooms[i]);
        }
      }

      return [...publicRoomsSet];
    } catch (e) {
      console.log(e.stack);
      return new RpcException({
        key: "INTERNAL_ERROR",
        code: GlobalErrorCodes.INTERNAL_ERROR.code,
        message: GlobalErrorCodes.INTERNAL_ERROR.value
      });
    }
  }

  async updateRoom(
    rights: string[],
    userId: string,
    roomId: string,
    roomDto: Partial<RoomDto>
  ): Promise<HttpStatus | RoomDocument | Observable<any> | RpcException> {
    try {
      if (rights.includes("CHANGE_ROOM") && (await this._verifyRights(rights, new Types.ObjectId(userId), new Types.ObjectId(roomId)))) {
        const room = await this.roomModel.findOne({ _id: new Types.ObjectId(roomId) });

        const updatedRoom = {
          usersID: room.usersID,
          messagesID: room.messagesID,
          _id: room._id,
          name: roomDto.name ? roomDto.name : room.name,
          description: roomDto.description ? roomDto.description : room.description,
          isUser: room.isUser,
          photo: room.photo,
          isPrivate: roomDto.isPrivate ? roomDto.isPrivate : room.isPrivate,
          membersCount: roomDto.membersCount ? roomDto.membersCount : room.membersCount,
          createdAt: room.createdAt,
          updatedAt: new Date()
        };
        await this.roomModel.updateOne({ _id: room._id }, updatedRoom);
        return await this.roomModel.findOne({ _id: new Types.ObjectId(roomId) });
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

  async changeRoomPhoto(
    rights: string[],
    userId: string,
    roomId: string,
    photo: any
  ): Promise<HttpStatus | RoomDocument | Observable<any> | RpcException> {
    try {
      if (rights.includes("CHANGE_ROOM") && (await this._verifyRights(rights, new Types.ObjectId(userId), new Types.ObjectId(roomId)))) {
        const room = await this.roomModel.findOne({ _id: new Types.ObjectId(roomId) });

        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
          secure: true
        });

        const result = await cloudinary.uploader.upload(photo.photo, {
          overwrite: true,
          invalidate: true,
          folder: `ChatiZZe/${room._id}/`,
          public_id: `photo`
        });

        await this.userModel.updateOne(
          { _id: userId },
          {
            photo: result ? result.secure_url : room.photo
          }
        );
        await this.roomModel.findOne({ _id: new Types.ObjectId(roomId) });
      }
      return HttpStatus.UNAUTHORIZED;
    } catch (e) {
      console.log(e.stack);
      if (e instanceof RpcException) {
        return new RpcException(e);
      }
    }
  }

  async deleteRoom(rights: string[], userId: string, roomId: string): Promise<HttpStatus | Observable<any> | RpcException> {
    try {
      if (rights.includes("DELETE_ROOM") && (await this._verifyRights(rights, new Types.ObjectId(userId), new Types.ObjectId(roomId)))) {
        const { deletedCount } = await this.roomModel.deleteOne({ _id: new Types.ObjectId(roomId) });

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

  async deleteMessageFromRoom(
    rights: string[],
    userId: string,
    roomId: string,
    messageId: string
  ): Promise<HttpStatus | Observable<any> | RpcException> {
    try {
      const searchResult = await this.roomModel.findOne({ _id: new Types.ObjectId(roomId) });

      const messagePosition = searchResult.messagesID.findIndex((item) => item === new Types.ObjectId(messageId));

      if (messagePosition > -1) {
        searchResult.messagesID.splice(messagePosition, 1);
        await this.roomModel.updateOne({ _id: new Types.ObjectId(roomId) }, searchResult);
        return HttpStatus.CREATED;
      } else {
        return HttpStatus.NOT_FOUND;
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

  async addMessageReferenceToRoom(
    rights: string[],
    userId: string,
    messageId: string,
    roomId: string
  ): Promise<HttpStatus | Observable<any> | RpcException> {
    try {
      const searchResult = await this.roomModel.findOne({ _id: new Types.ObjectId(roomId) });

      searchResult.messagesID.push(new Types.ObjectId(messageId));

      await this.roomModel.updateOne({ _id: new Types.ObjectId(roomId) }, searchResult);

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

  async addRecentMessage(recentMessage: RecentMessageDto, roomId: string): Promise<HttpStatus | Observable<any> | RpcException> {
    try {
      await this.roomModel.updateOne({ roomId: roomId }, { $addToSet: { recentMessage: recentMessage } });

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

  async enterPublicRoom(userId: string, roomId: string): Promise<HttpStatus | Observable<any> | RpcException> {
    try {
      const searchResult = await this.roomModel.findOne({ _id: new Types.ObjectId(roomId) });

      if (searchResult) {
        searchResult.usersID.push(new Types.ObjectId(userId));

        await this.roomModel.updateOne({ _id: new Types.ObjectId(roomId) }, searchResult);
        await this.rightsModel.create({
          user: new Types.ObjectId(userId),
          roomId: new Types.ObjectId(roomId),
          rights: ["SEND_MESSAGES", "SEND_ATTACHMENTS", "UPDATE_MESSAGE"]
        });
        return HttpStatus.OK;
      }
      return HttpStatus.BAD_REQUEST;
    } catch (e) {
      console.log(e.stack);
      return new RpcException({
        key: "INTERNAL_ERROR",
        code: GlobalErrorCodes.INTERNAL_ERROR.code,
        message: GlobalErrorCodes.INTERNAL_ERROR.value
      });
    }
  }

  async addUserToRoom(
    rights: string[],
    userId: string,
    roomId: string,
    newUserIdentifier: string,
    userRights: string[]
  ): Promise<HttpStatus | Observable<any> | RpcException> {
    try {
      if (rights.includes("ADD_USERS") && (await this._verifyRights(rights, new Types.ObjectId(userId), new Types.ObjectId(roomId)))) {
        let user: UserDocument;
        const searchResult = await this.roomModel.findOne({ _id: new Types.ObjectId(roomId) });

        if (newUserIdentifier.includes("@")) {
          user = await this.userModel.findOne({ email: newUserIdentifier });
        } else if (newUserIdentifier.includes("+")) {
          user = await this.userModel.findOne({ phoneNumber: newUserIdentifier });
        } else {
          user = await this.userModel.findOne({ username: newUserIdentifier });
        }

        if (searchResult) {
          searchResult.usersID.push(new Types.ObjectId(user._id));

          await this.roomModel.updateOne({ _id: new Types.ObjectId(roomId) }, searchResult);
          await this.rightsModel.create({
            user: new Types.ObjectId(user._id),
            roomId: new Types.ObjectId(roomId),
            rights: userRights
          });
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

  async deleteUserFromRoom(
    rights: string[],
    userId: string,
    roomId: string,
    type: "DELETE_USER" | "LEAVE_ROOM"
  ): Promise<HttpStatus | Observable<any> | RpcException> {
    try {
      let indicator = false;

      if (
        type === "DELETE_USER" &&
        rights.includes("DELETE_USERS") &&
        (await this._verifyRights(rights, new Types.ObjectId(userId), new Types.ObjectId(roomId)))
      ) {
        indicator = true;
      } else if (type === "LEAVE_ROOM") {
        indicator = true;
      }

      if (indicator) {
        const searchResult = await this.roomModel.findOne({ _id: new Types.ObjectId(roomId) });

        if (searchResult) {
          const userPosition = searchResult.usersID.findIndex((item) => item === new Types.ObjectId(userId));

          if (type === "LEAVE_ROOM" && searchResult.usersID.length === 1) {
            const { deletedCount } = await this.roomModel.deleteOne({ _id: new Types.ObjectId(roomId) });

            if (deletedCount !== 0) {
              return HttpStatus.OK;
            } else {
              return HttpStatus.NOT_FOUND;
            }
          }

          if (userPosition > -1) {
            searchResult.usersID.splice(userPosition, 1);
            await this.roomModel.updateOne({ _id: new Types.ObjectId(roomId) }, searchResult);
            return HttpStatus.CREATED;
          } else {
            return HttpStatus.NOT_FOUND;
          }
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

  async changeUserRightsInRoom(
    rights: string[],
    performerUserId: string,
    targetUserId: string,
    roomId: string,
    newRights: string[]
  ): Promise<HttpStatus | Observable<any> | RpcException> {
    try {
      if (
        rights.includes("CHANGE_USER_RIGHTS") &&
        (await this._verifyRights(rights, new Types.ObjectId(performerUserId), new Types.ObjectId(roomId)))
      ) {
        const { nModified } = await this.rightsModel.updateOne(
          { user: new Types.ObjectId(targetUserId), roomId: new Types.ObjectId(roomId) },
          { rights: newRights }
        );

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

  async changeNotificationSettings(
    userId: string,
    roomId: string,
    notifications: boolean
  ): Promise<HttpStatus | Observable<any> | RpcException> {
    try {
      const prevNotificationsSettings = await this.notificationsModel.findOne({
        user: new Types.ObjectId(userId),
        roomId: new Types.ObjectId(roomId)
      });

      const updatedSettings = {
        _id: prevNotificationsSettings._id,
        user: prevNotificationsSettings.user,
        roomId: prevNotificationsSettings.roomId,
        notifications: notifications
      };

      await this.notificationsModel.updateOne(
        {
          user: new Types.ObjectId(userId),
          roomId: new Types.ObjectId(roomId)
        },
        updatedSettings
      );
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

  async getUserNotificationsSettings(userId: string): Promise<NotificationsDocument[] | RpcException> {
    try {
      return await this.notificationsModel.find({ user: new Types.ObjectId(userId) });
    } catch (e) {
      console.log(e.stack);
      return new RpcException({
        key: "INTERNAL_ERROR",
        code: GlobalErrorCodes.INTERNAL_ERROR.code,
        message: GlobalErrorCodes.INTERNAL_ERROR.value
      });
    }
  }

  private async __setUserNotificationsSettings(
    userId: Types.ObjectId,
    roomId: Types.ObjectId,
    notifications: boolean
  ): Promise<HttpStatus | RpcException> {
    try {
      await this.notificationsModel.create({ user: userId, roomId: roomId, notifications });
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

  private async _verifyRights(
    rights: string[],
    user: Types.ObjectId,
    roomId: Types.ObjectId
  ): Promise<boolean | Observable<any> | RpcException> {
    try {
      return await this.rightsModel.exists({ user, roomId, rights });
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
