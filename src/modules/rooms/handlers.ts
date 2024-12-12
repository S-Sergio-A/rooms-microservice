import { Injectable } from "@nestjs/common";
import { RabbitQueuesEnum } from "@ssmovzh/chatterly-common-utils";
import { RoomsService } from "~/modules/rooms/rooms.service";

@Injectable()
export class Handlers {
  private handlers = new Map<RabbitQueuesEnum, any>();

  constructor(private readonly roomsService: RoomsService) {
    this.handlers.set(RabbitQueuesEnum.ADD_WELCOME_CHAT, this.roomsService.addWelcomeChat.bind(this.roomsService));
    this.handlers.set(RabbitQueuesEnum.CREATE_ROOM, this.roomsService.createRoom.bind(this.roomsService));
    this.handlers.set(RabbitQueuesEnum.GET_ALL_ROOMS, this.roomsService.getAllRooms.bind(this.roomsService));
    this.handlers.set(RabbitQueuesEnum.GET_ALL_USER_ROOMS, this.roomsService.getAllRooms.bind(this.roomsService));
    this.handlers.set(RabbitQueuesEnum.FIND_ROOM_AND_USERS_BY_NAME, this.roomsService.findRoomAndUsersByName.bind(this.roomsService));
    this.handlers.set(RabbitQueuesEnum.UPDATE_ROOM, this.roomsService.updateRoom.bind(this.roomsService));
    this.handlers.set(RabbitQueuesEnum.CHANGE_ROOM_PHOTO, this.roomsService.changeRoomPhoto.bind(this.roomsService));
    this.handlers.set(RabbitQueuesEnum.DELETE_ROOM, this.roomsService.deleteRoom.bind(this.roomsService));
    this.handlers.set(RabbitQueuesEnum.ADD_MESSAGE_REFERENCE, this.roomsService.addMessageReferenceToRoom.bind(this.roomsService));
    this.handlers.set(RabbitQueuesEnum.ADD_RECENT_MESSAGE, this.roomsService.addRecentMessage.bind(this.roomsService));
    this.handlers.set(RabbitQueuesEnum.DELETE_MESSAGE_REFERENCE, this.roomsService.deleteMessageFromRoom.bind(this.roomsService));
    this.handlers.set(RabbitQueuesEnum.ENTER_PUBLIC_ROOM, this.roomsService.enterPublicRoom.bind(this.roomsService));
    this.handlers.set(RabbitQueuesEnum.ADD_USER, this.roomsService.addUserToRoom.bind(this.roomsService));
    this.handlers.set(RabbitQueuesEnum.DELETE_USER, this.roomsService.deleteUserFromRoom.bind(this.roomsService));
    this.handlers.set(RabbitQueuesEnum.CHANGE_USER_RIGHTS, this.roomsService.changeUserRightsInRoom.bind(this.roomsService));
    this.handlers.set(RabbitQueuesEnum.GET_NOTIFICATIONS_SETTINGS, this.roomsService.getUserNotificationsSettings.bind(this.roomsService));
    this.handlers.set(RabbitQueuesEnum.CHANGE_NOTIFICATIONS_SETTINGS, this.roomsService.changeNotificationSettings.bind(this.roomsService));
    this.handlers.set(RabbitQueuesEnum.LOAD_RIGHTS, this.roomsService.loadRights.bind(this.roomsService));
  }

  get(action: RabbitQueuesEnum): () => any {
    const handlerFunction = this.handlers.get(action);

    if (!handlerFunction) {
      throw new Error("Unknown queue type.");
    }

    return handlerFunction;
  }
}
