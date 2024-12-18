import { HttpStatus, Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ConfigService } from "@nestjs/config";
import {
  CloudinaryConfigInterface,
  GLOBAL_ERROR_CODES,
  GlobalErrorCodesEnum,
  LoggerService,
  Message,
  ModelsNamesEnum,
  Notification,
  Right,
  RightsEnum,
  Room,
  User
} from "@ssmovzh/chatterly-common-utils";
import { Model, Types } from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import { RoomDto } from "./dto/room.dto";

const { ObjectId } = Types;

@Injectable()
export class RoomsService {
  constructor(
    @InjectModel(ModelsNamesEnum.ROOMS) private readonly roomModel: Model<Room>,
    @InjectModel(ModelsNamesEnum.MESSAGES) private readonly messageModel: Model<Message>,
    @InjectModel(ModelsNamesEnum.RIGHTS) private readonly rightsModel: Model<Right>,
    @InjectModel(ModelsNamesEnum.NOTIFICATIONS) private readonly notificationsModel: Model<Notification>,
    @InjectModel(ModelsNamesEnum.USERS) private readonly userModel: Model<User>,
    private readonly logger: LoggerService,
    private readonly configService: ConfigService
  ) {}

  async addWelcomeChat({ user: userId }: { user: string }): Promise<HttpStatus> {
    try {
      const welcomeChat = await this.roomModel.findOne<Room>({ name: "Chatterly" });

      welcomeChat.usersID = [...welcomeChat.usersID, new ObjectId(userId)];

      await welcomeChat.save();

      await this.rightsModel.create({
        user: new ObjectId(userId),
        roomId: welcomeChat._id,
        rights: [RightsEnum.DELETE_ROOM]
      });

      await this.__setUserNotificationsSettings(new ObjectId(userId), welcomeChat._id as Types.ObjectId, true);
      return HttpStatus.CREATED;
    } catch (error) {
      this.logger.error(error, error.trace);
      const { httpCode, msg } = GLOBAL_ERROR_CODES.get(GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR);
      throw new InternalServerErrorException({
        key: GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR,
        code: httpCode,
        message: msg
      });
    }
  }

  async createRoom(roomDto: RoomDto & { userId: string }): Promise<HttpStatus> {
    try {
      const createdRoom: Room = new this.roomModel(roomDto);
      createdRoom.usersID.push(new ObjectId(roomDto.userId));
      createdRoom.photo = "https://via.placeholder.com/60";
      createdRoom.recentMessage = new this.messageModel({
        text: "loading...",
        roomId: createdRoom._id as Types.ObjectId,
        attachment: ["loading..."],
        timestamp: "loading...",
        user: new this.userModel({
          username: "Loading...",
          password: "Loading...",
          photo: "https://via.placeholder.com/60",
          email: "Loading...",
          phoneNumber: "Loading...",
          firstName: "Loading...",
          lastName: "Loading...",
          birthday: "Loading...",
          verification: "Loading...",
          isActive: false,
          isBlocked: false,
          verificationExpires: 0,
          loginAttempts: 0,
          blockExpires: 0
        })
      });

      await createdRoom.save();

      await this.rightsModel.create({
        user: new ObjectId(roomDto.userId),
        roomId: createdRoom._id,
        rights: Object.values(RightsEnum)
      });
      await this.__setUserNotificationsSettings(new ObjectId(roomDto.userId), createdRoom._id as Types.ObjectId, true);
      return HttpStatus.CREATED;
    } catch (error) {
      this.logger.error(error, error.trace);
      const { httpCode, msg } = GLOBAL_ERROR_CODES.get(GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR);
      throw new InternalServerErrorException({
        key: GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR,
        code: httpCode,
        message: msg
      });
    }
  }

  async getAllRooms(): Promise<(Room | { recentMessage: any })[]> {
    try {
      return await this.roomModel.find();
    } catch (error) {
      this.logger.error(error, error.trace);
      const { httpCode, msg } = GLOBAL_ERROR_CODES.get(GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR);
      throw new InternalServerErrorException({
        key: GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR,
        code: httpCode,
        message: msg
      });
    }
  }

  async getAllUserRooms({ userId }: { userId: string }): Promise<Room[]> {
    try {
      const result: any[] = [];

      const userRooms = await this.roomModel
        .find()
        .populate("usersID", "_id firstName lastName birthday username email phoneNumber photo", this.userModel);

      // O^2
      if (!(userRooms instanceof Error)) {
        for (let i = 0; i < userRooms.length; i++) {
          const idsArrLen = userRooms[i].usersID.length;
          for (let k = 0; k < idsArrLen; k++) {
            if (userRooms[i].usersID[k]._id.toString() === userId) {
              result.push(userRooms[i]);
            }
          }
        }
      }

      return result;
    } catch (error) {
      this.logger.error(error, error.trace);
      const { httpCode, msg } = GLOBAL_ERROR_CODES.get(GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR);
      throw new InternalServerErrorException({
        key: GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR,
        code: httpCode,
        message: msg
      });
    }
  }

  async findRoomAndUsersByName({ name, userId }: { name: string; userId: string }): Promise<Room[]> {
    try {
      const regex = new RegExp(name, "gi");
      const rooms = await this.roomModel.find({ name: regex, isPrivate: false });
      const users = await this.userModel.find({ name: regex });

      const resultSet: any = new Set();
      rooms.forEach(resultSet.add, resultSet);
      users.forEach(resultSet.add, resultSet);

      for (let i = 0; i < rooms.length; i++) {
        if (rooms[i].usersID.includes(new ObjectId(userId))) {
          resultSet.add(rooms[i]);
        }
      }

      return [...resultSet];
    } catch (error) {
      this.logger.error(error, error.trace);
      const { httpCode, msg } = GLOBAL_ERROR_CODES.get(GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR);
      throw new InternalServerErrorException({
        key: GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR,
        code: httpCode,
        message: msg
      });
    }
  }

  async updateRoom({
    roomId,
    roomDto,
    userId,
    rights
  }: {
    rights: RightsEnum[];
    userId: string;
    roomId: string;
    roomDto: Partial<RoomDto>;
  }): Promise<HttpStatus | Room> {
    try {
      if (rights.includes(RightsEnum.CHANGE_ROOM) && (await this.__verifyRights(rights, new ObjectId(userId), new ObjectId(roomId)))) {
        const room = await this.roomModel.findOne({ _id: new ObjectId(roomId) });

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
        return await this.roomModel.findOne({ _id: new ObjectId(roomId) });
      }
      return HttpStatus.UNAUTHORIZED;
    } catch (error) {
      this.logger.error(error, error.trace);
      const { httpCode, msg } = GLOBAL_ERROR_CODES.get(GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR);
      throw new InternalServerErrorException({
        key: GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR,
        code: httpCode,
        message: msg
      });
    }
  }

  async changeRoomPhoto({
    rights,
    userId,
    roomId,
    photo
  }: {
    rights: RightsEnum[];
    userId: string;
    roomId: string;
    photo: string;
  }): Promise<HttpStatus | Room> {
    try {
      if (!rights.includes(RightsEnum.CHANGE_ROOM) || !(await this.__verifyRights(rights, new ObjectId(userId), new ObjectId(roomId)))) {
        return null;
      }
      const room = await this.roomModel.findOne({ _id: new ObjectId(roomId) });
      const { apiKey, apiSecret, cloudName } = this.configService.get<CloudinaryConfigInterface>("cloudinary");

      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true
      });

      const result = await cloudinary.uploader.upload(photo, {
        overwrite: true,
        invalidate: true,
        folder: `Chatterly/${room._id}/`,
        public_id: `photo`
      });

      await this.roomModel.updateOne(
        { _id: roomId },
        {
          photo: result ? result.secure_url : room.photo
        }
      );
      return await this.roomModel.findOne({ _id: roomId });
    } catch (error) {
      this.logger.error(error, error.trace);
      const { httpCode, msg } = GLOBAL_ERROR_CODES.get(GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR);
      throw new InternalServerErrorException({
        key: GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR,
        code: httpCode,
        message: msg
      });
    }
  }

  async deleteRoom({ roomId, userId, rights }: { rights: RightsEnum[]; userId: string; roomId: string }): Promise<HttpStatus> {
    try {
      if (rights.includes(RightsEnum.DELETE_ROOM) && (await this.__verifyRights(rights, new ObjectId(userId), new ObjectId(roomId)))) {
        const { deletedCount } = await this.roomModel.deleteOne({ _id: new ObjectId(roomId) });

        if (deletedCount !== 0) {
          return HttpStatus.OK;
        } else {
          return HttpStatus.NOT_FOUND;
        }
      }
      return HttpStatus.UNAUTHORIZED;
    } catch (error) {
      this.logger.error(error, error.trace);
      const { httpCode, msg } = GLOBAL_ERROR_CODES.get(GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR);
      throw new InternalServerErrorException({
        key: GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR,
        code: httpCode,
        message: msg
      });
    }
  }

  async deleteMessageFromRoom({ messageId, roomId }: { messageId: string; roomId: string }): Promise<HttpStatus> {
    try {
      const searchResult = await this.roomModel.findOne({ _id: new ObjectId(roomId) });

      const messagePosition = searchResult.messagesID.findIndex((item) => item === new ObjectId(messageId));

      if (messagePosition > -1) {
        searchResult.messagesID.splice(messagePosition, 1);
        await this.roomModel.updateOne({ _id: new ObjectId(roomId) }, searchResult);
        return HttpStatus.CREATED;
      } else {
        return HttpStatus.NOT_FOUND;
      }
    } catch (error) {
      this.logger.error(error, error.trace);
      const { httpCode, msg } = GLOBAL_ERROR_CODES.get(GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR);
      throw new InternalServerErrorException({
        key: GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR,
        code: httpCode,
        message: msg
      });
    }
  }

  async addMessageReferenceToRoom({ messageId, roomId }: { messageId: string; roomId: string }): Promise<HttpStatus> {
    try {
      const searchResult = await this.roomModel.findOne({ _id: new ObjectId(roomId) });

      searchResult.messagesID.push(new ObjectId(messageId));

      await this.roomModel.updateOne({ _id: new ObjectId(roomId) }, searchResult);

      return HttpStatus.CREATED;
    } catch (error) {
      this.logger.error(error, error.trace);
      const { httpCode, msg } = GLOBAL_ERROR_CODES.get(GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR);
      throw new InternalServerErrorException({
        key: GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR,
        code: httpCode,
        message: msg
      });
    }
  }

  async addRecentMessage({ roomId }: { roomId: string }): Promise<HttpStatus> {
    try {
      const theLastMessage = await this.messageModel
        .find({ roomId: new ObjectId(roomId) })
        .sort({ $natural: -1 })
        .limit(1)
        .populate("user", "id username", this.userModel);

      if (!theLastMessage.length) {
        return HttpStatus.BAD_REQUEST;
      }

      const [msg] = theLastMessage;

      const recentMessage = {
        _id: msg._id,
        user: {
          _id: msg.user._id,
          username: (msg.user as User).username
        },
        roomId,
        text: msg.text,
        attachment: msg.attachment,
        timestamp: msg.timestamp
      };

      await this.roomModel.updateOne({ roomId: roomId }, { $addToSet: { recentMessage: recentMessage } });

      return HttpStatus.CREATED;
    } catch (error) {
      this.logger.error(error, error.trace);
      const { httpCode, msg } = GLOBAL_ERROR_CODES.get(GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR);
      throw new InternalServerErrorException({
        key: GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR,
        code: httpCode,
        message: msg
      });
    }
  }

  async enterPublicRoom({ userId, roomId }: { userId: string; roomId: string }): Promise<HttpStatus> {
    try {
      const searchResult = await this.roomModel.findOne({ _id: new ObjectId(roomId) });

      if (searchResult) {
        searchResult.usersID.push(new ObjectId(userId));
        searchResult.usersID = Array.from(new Set(searchResult.usersID.map(String))).map((id) => new ObjectId(id));

        await this.roomModel.updateOne({ _id: new ObjectId(roomId) }, searchResult);
        await this.rightsModel.create({
          user: new ObjectId(userId),
          roomId: new ObjectId(roomId),
          rights: [RightsEnum.SEND_MESSAGES, RightsEnum.SEND_ATTACHMENTS, RightsEnum.CHANGE_MESSAGES]
        });
        return HttpStatus.OK;
      }
      return HttpStatus.BAD_REQUEST;
    } catch (error) {
      this.logger.error(error, error.trace);
      const { httpCode, msg } = GLOBAL_ERROR_CODES.get(GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR);
      throw new InternalServerErrorException({
        key: GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR,
        code: httpCode,
        message: msg
      });
    }
  }

  async addUserToRoom({
    rights,
    userId,
    roomId,
    userRights,
    newUserIdentifier
  }: {
    rights: RightsEnum[];
    userId: string;
    roomId: string;
    newUserIdentifier: string;
    userRights: string[];
  }): Promise<HttpStatus> {
    try {
      if (rights.includes(RightsEnum.ADD_USERS) && (await this.__verifyRights(rights, new ObjectId(userId), new ObjectId(roomId)))) {
        let user: User;
        const searchResult = await this.roomModel.findOne({ _id: new ObjectId(roomId) });

        if (newUserIdentifier.includes("@")) {
          user = await this.userModel.findOne({ email: newUserIdentifier });
        } else if (newUserIdentifier.includes("+")) {
          user = await this.userModel.findOne({ phoneNumber: newUserIdentifier });
        } else {
          user = await this.userModel.findOne({ username: newUserIdentifier });
        }

        if (searchResult) {
          let userId: Types.ObjectId;

          if (user.id) {
            userId = new ObjectId(user._id as string);
          }

          searchResult.usersID.push(userId);

          await this.roomModel.updateOne({ _id: new ObjectId(roomId) }, searchResult);
          await this.rightsModel.create({
            user: userId,
            roomId: new ObjectId(roomId),
            rights: userRights
          });
          return HttpStatus.CREATED;
        }
        return HttpStatus.BAD_REQUEST;
      } else {
        return HttpStatus.UNAUTHORIZED;
      }
    } catch (error) {
      this.logger.error(error, error.trace);
      const { httpCode, msg } = GLOBAL_ERROR_CODES.get(GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR);
      throw new InternalServerErrorException({
        key: GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR,
        code: httpCode,
        message: msg
      });
    }
  }

  async deleteUserFromRoom({
    rights,
    userId,
    roomId,
    userIdToBeDeleted,
    type
  }: {
    rights: RightsEnum[];
    userId: string;
    userIdToBeDeleted: string;
    roomId: string;
    type: "DELETE_USER" | "LEAVE_ROOM";
  }): Promise<HttpStatus> {
    try {
      let indicator = false;

      if (
        type === "DELETE_USER" &&
        rights.includes(RightsEnum.DELETE_USERS) &&
        (await this.__verifyRights(rights, new ObjectId(userId), new ObjectId(roomId)))
      ) {
        indicator = true;
      } else if (type === RightsEnum.LEAVE_ROOM) {
        indicator = new ObjectId(userId) === new ObjectId(userIdToBeDeleted);
      }

      if (indicator) {
        const searchResult = await this.roomModel.findOne({ _id: new ObjectId(roomId) });

        if (searchResult) {
          const userPosition = searchResult.usersID.findIndex((item) => item.toString() === userIdToBeDeleted);

          if (type === "LEAVE_ROOM" && searchResult.usersID.length === 1) {
            const { deletedCount } = await this.roomModel.deleteOne({ _id: new ObjectId(roomId) });

            if (deletedCount !== 0) {
              return HttpStatus.OK;
            } else {
              return HttpStatus.NOT_FOUND;
            }
          }

          if (userPosition > -1) {
            searchResult.usersID.splice(userPosition, 1);
            await this.roomModel.updateOne({ _id: new ObjectId(roomId) }, searchResult);
            return HttpStatus.CREATED;
          } else {
            return HttpStatus.NOT_FOUND;
          }
        } else {
          return HttpStatus.BAD_REQUEST;
        }
      }

      return HttpStatus.UNAUTHORIZED;
    } catch (error) {
      this.logger.error(error, error.trace);
      const { httpCode, msg } = GLOBAL_ERROR_CODES.get(GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR);
      throw new InternalServerErrorException({
        key: GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR,
        code: httpCode,
        message: msg
      });
    }
  }

  async changeUserRightsInRoom({
    rights,
    newRights,
    roomId,
    performerUserId,
    targetUserId
  }: {
    rights: RightsEnum[];
    performerUserId: string;
    targetUserId: string;
    roomId: string;
    newRights: string[];
  }): Promise<HttpStatus> {
    try {
      if (
        rights.includes(RightsEnum.CHANGE_USER_RIGHTS) &&
        (await this.__verifyRights(rights, new ObjectId(performerUserId), new ObjectId(roomId)))
      ) {
        const nModified = await this.rightsModel.updateOne(
          { user: new ObjectId(targetUserId), roomId: new ObjectId(roomId) },
          { rights: newRights }
        );

        if (nModified) {
          return HttpStatus.CREATED;
        } else {
          return HttpStatus.BAD_REQUEST;
        }
      } else {
        return HttpStatus.UNAUTHORIZED;
      }
    } catch (error) {
      this.logger.error(error, error.trace);
      const { httpCode, msg } = GLOBAL_ERROR_CODES.get(GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR);
      throw new InternalServerErrorException({
        key: GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR,
        code: httpCode,
        message: msg
      });
    }
  }

  async changeNotificationSettings({
    userId,
    roomId,
    notifications
  }: {
    userId: string;
    roomId: string;
    notifications: boolean;
  }): Promise<HttpStatus> {
    try {
      const prevNotificationsSettings = await this.notificationsModel.findOne({
        user: new ObjectId(userId),
        roomId: new ObjectId(roomId)
      });

      const updatedSettings = {
        _id: prevNotificationsSettings._id,
        user: prevNotificationsSettings.user,
        roomId: prevNotificationsSettings.roomId,
        notifications: notifications
      };

      await this.notificationsModel.updateOne(
        {
          user: new ObjectId(userId),
          roomId: new ObjectId(roomId)
        },
        updatedSettings
      );
      return HttpStatus.CREATED;
    } catch (error) {
      this.logger.error(error, error.trace);
      const { httpCode, msg } = GLOBAL_ERROR_CODES.get(GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR);
      throw new InternalServerErrorException({
        key: GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR,
        code: httpCode,
        message: msg
      });
    }
  }

  async getUserNotificationsSettings({ userId }: { userId: string }): Promise<Notification[]> {
    try {
      return await this.notificationsModel.find({ user: new ObjectId(userId) });
    } catch (error) {
      this.logger.error(error, error.trace);
      const { httpCode, msg } = GLOBAL_ERROR_CODES.get(GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR);
      throw new InternalServerErrorException({
        key: GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR,
        code: httpCode,
        message: msg
      });
    }
  }

  async loadRights({ userId, roomId }: { userId: string; roomId: string }): Promise<Right> {
    try {
      return await this.rightsModel.findOne({ user: new ObjectId(userId), roomId: new ObjectId(roomId) });
    } catch (error) {
      this.logger.error(error, error.trace);
      const { httpCode, msg } = GLOBAL_ERROR_CODES.get(GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR);
      throw new InternalServerErrorException({
        key: GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR,
        code: httpCode,
        message: msg
      });
    }
  }

  private async __setUserNotificationsSettings(
    userId: Types.ObjectId,
    roomId: Types.ObjectId,
    notifications: boolean
  ): Promise<HttpStatus> {
    try {
      await this.notificationsModel.create({ user: userId, roomId: roomId, notifications });
      return HttpStatus.CREATED;
    } catch (error) {
      this.logger.error(error, error.trace);
      const { httpCode, msg } = GLOBAL_ERROR_CODES.get(GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR);
      throw new InternalServerErrorException({
        key: GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR,
        code: httpCode,
        message: msg
      });
    }
  }

  private async __verifyRights(rights: RightsEnum[], user: Types.ObjectId, roomId: Types.ObjectId): Promise<boolean> {
    try {
      const exists = await this.rightsModel.exists({ user, roomId, rights });
      return !!exists._id;
    } catch (error) {
      this.logger.error(error, error.trace);
      const { httpCode, msg } = GLOBAL_ERROR_CODES.get(GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR);
      throw new InternalServerErrorException({
        key: GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR,
        code: httpCode,
        message: msg
      });
    }
  }
}
